from multiprocessing import Process, Queue

import os
import traceback


"""
Everything regarding managing the user process during gameplay is included here.
PlayerProcess is the interface that the main game process uses to interact
with the player process (the interface also includes nice utility functions to 
restart, pause, and terminate the player process). 

The actual player process that is run is described by run_player_process. It includes
securitization measures, memory checks, and a while(True) loop for recieving
instructions on what player functions to call from the interface.
"""

def get_file_permissions(file_path):
    import stat 
    """
    Get file permissions in both symbolic and octal formats.
    """
    
    # Ensure file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # Get file status
    file_stat = os.stat(file_path)

    # Get octal permission mask
    octal_perm = oct(file_stat.st_mode & 0o777)

    # Get symbolic permission string (e.g., -rw-r--r--)
    symbolic_perm = stat.filemode(file_stat.st_mode)

    return symbolic_perm, octal_perm

def drop_priveliges(user_name=None, group_name=None):
    
    import os
    import pwd
    import grp

    os.environ.clear()

    if not user_name is None and not group_name is None:
        uid = pwd.getpwnam(user_name).pw_uid
        gid = grp.getgrnam(group_name).gr_gid

        # print(uid, gid)
        os.setgid(gid)
        os.setuid(uid)

    # Get the directory above 'engine'
    # base_dir = os.getcwd()  # /app/BotFightEngine

    # # Build full path
    # agent_path = os.path.join(base_dir, "game_env", "game_subs", "temp", "player_a")

    # print(get_file_permissions(agent_path))

def apply_seccomp():
    try:
        import seccomp
    except ImportError:
        import pyseccomp as seccomp
    import prctl
    import signal
    import os

    # prctl.set_ptracer(None)
    prctl.set_no_new_privs(True)
    ctx = seccomp.SyscallFilter(defaction=seccomp.ALLOW)
    # filesystem
    ctx.add_rule(seccomp.KILL, 'chdir')
    ctx.add_rule(seccomp.KILL, 'chmod')
    ctx.add_rule(seccomp.KILL, 'fchmod')
    ctx.add_rule(seccomp.KILL, 'fchmodat')
    ctx.add_rule(seccomp.KILL, 'chown')
    ctx.add_rule(seccomp.KILL, 'fchown')
    ctx.add_rule(seccomp.KILL, 'lchown')
    ctx.add_rule(seccomp.KILL, 'chroot')
    # ctx.add_rule(seccomp.KILL, 'unlink')
    # ctx.add_rule(seccomp.KILL, 'unlinkat')
    # ctx.add_rule(seccomp.KILL, 'rename')
    # ctx.add_rule(seccomp.KILL, 'renameat')
    # ctx.add_rule(seccomp.KILL, 'rmdir')
    # ctx.add_rule(seccomp.KILL, 'mkdir')
    ctx.add_rule(seccomp.KILL, 'mount')
    ctx.add_rule(seccomp.KILL, 'umount2')
    ctx.add_rule(seccomp.KILL, 'symlink')
    # ctx.add_rule(seccomp.KILL, 'link')
    # ctx.add_rule(seccomp.KILL, 'creat')
    ctx.add_rule(seccomp.KILL, 'truncate')
    ctx.add_rule(seccomp.KILL, 'ftruncate')
    # ctx.add_rule(seccomp.KILL, 'pwrite64')

    # #time
    ctx.add_rule(seccomp.KILL, 'adjtimex')
    ctx.add_rule(seccomp.KILL, 'clock_settime')
    ctx.add_rule(seccomp.KILL, 'clock_adjtime')
    ctx.add_rule(seccomp.KILL, 'settimeofday')

    # #network    
    ctx.add_rule(seccomp.KILL, 'socket')
    ctx.add_rule(seccomp.KILL, 'bind')
    ctx.add_rule(seccomp.KILL, 'accept')
    ctx.add_rule(seccomp.KILL, 'connect')
    ctx.add_rule(seccomp.KILL, 'listen')
    ctx.add_rule(seccomp.KILL, 'setsockopt')
    ctx.add_rule(seccomp.KILL, 'getsockopt')
    ctx.add_rule(seccomp.KILL, "sendto")
    ctx.add_rule(seccomp.KILL, "recvfrom")
    ctx.add_rule(seccomp.KILL, "sendmsg")
    ctx.add_rule(seccomp.KILL, "recvmsg")
    ctx.add_rule(seccomp.KILL, 'unshare')
    
    # kernel
    ctx.add_rule(seccomp.KILL, 'reboot')
    ctx.add_rule(seccomp.KILL, 'shutdown')
    ctx.add_rule(seccomp.KILL, 'sysfs')
    ctx.add_rule(seccomp.KILL, 'sysinfo')
    ctx.add_rule(seccomp.KILL, "delete_module")
    ctx.add_rule(seccomp.KILL, 'prctl')
    ctx.add_rule(seccomp.KILL, 'execve')
    ctx.add_rule(seccomp.KILL, 'execveat')
    ctx.add_rule(seccomp.KILL, 'seccomp')

    # #i/o
    # ctx.add_rule(seccomp.KILL, 'ioctl')
    # ctx.add_rule(seccomp.KILL, 'keyctl')
    # ctx.add_rule(seccomp.KILL, 'perf_event_open')
    ctx.add_rule(seccomp.KILL, 'kexec_load')
    # ctx.add_rule(seccomp.KILL, 'iopl')
    # ctx.add_rule(seccomp.KILL, 'ioperm')
    
    #process limiting + scheduling
    ctx.add_rule(seccomp.KILL, 'exit')
    ctx.add_rule(seccomp.KILL, 'setuid')
    ctx.add_rule(seccomp.KILL, 'setgid')
    ctx.add_rule(seccomp.KILL, 'capset')
    ctx.add_rule(seccomp.KILL, 'capget')
    ctx.add_rule(seccomp.KILL, 'kill')
    ctx.add_rule(seccomp.KILL, 'tkill')
    ctx.add_rule(seccomp.KILL, 'tgkill')
    ctx.add_rule(seccomp.KILL, "setrlimit")
    ctx.add_rule(seccomp.KILL, "setpriority")
    ctx.add_rule(seccomp.KILL, "sched_setparam")
    ctx.add_rule(seccomp.KILL, "sched_setscheduler")
    
    ctx.load()
    
# starts up a player process ready to recieve instructions
def run_player_process(player_name, submission_dir, player_queue, 
                       return_queue, limit_resources, use_gpu, out_queue, 
                       user_name=None, group_name=None):
    
    
    # try:
    import traceback
    import sys
    import importlib
    import os
    import tempfile
    
    import time
    import psutil


    sys.path.append(submission_dir)

    # numba_cache_root = os.path.join(submission_dir, ".numba_cache")
    # try:
    #     os.makedirs(numba_cache_root, exist_ok=True)
    # except Exception:
    #     numba_cache_root = tempfile.mkdtemp(prefix="numba_cache_")
    # os.environ.setdefault("NUMBA_CACHE_DIR", numba_cache_root)
    # os.environ.setdefault("NUMBA_TEMP_DIR", numba_cache_root)
    
    if(use_gpu):
        import pynvml
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)  # GPU 0

    limit_mb = 1536
    limit_bytes = limit_mb * 1024 * 1024 #set limit to 1 gb
    
    def checkMemory():
        pid = os.getpid()
        process = psutil.Process(pid)

        total_memory = process.memory_info().rss

        for child in process.children(recursive=True):
            total_memory += child.memory_info().rss

        if limit_resources and total_memory > limit_bytes:
            raise MemoryError("Allocated too much memory on physical RAM")
        
        return total_memory
    
    # Set your VRAM limit in bytes
    vram_limit_bytes = 4 * 1024**3  # 4 GB
    def checkVRAM():
        if(use_gpu):
            pid = os.getpid()
            
            # Get current process + all child PIDs
            process = psutil.Process(pid)
            pids = [process.pid] + [child.pid for child in process.children(recursive=True)]

            total_vram = 0
            for proc in pynvml.nvmlDeviceGetComputeRunningProcesses(handle):
                if proc.pid in pids:
                    total_vram += proc.usedGpuMemory  # in bytes                

            if limit_resources and total_vram > vram_limit_bytes:
                raise MemoryError("Allocated too much VRAM on GPU")

            return total_vram
        return 0
    
    def get_cur_time():
        return time.perf_counter()


    if(limit_resources):
        import resource
        resource.setrlimit(resource.RLIMIT_RSS, (limit_bytes, limit_bytes)) # only allow current process to run
        
        drop_priveliges(user_name, group_name)
        apply_seccomp()
    else:
        class QueueWriter:
            def __init__(self, queue):
                self.queue = queue
                self.turn = ""

            def set_turn(self, t):
                self.turn = t

            def write(self, message):
                # This method is called by print, we send message to out_queue
                if message != '\n':  # Ignore empty newlines that can be printed
                    self.queue.put("".join(["[", player_name," | ", self.turn, "]: ", message]))

            def flush(self):
                pass
    
        printer = QueueWriter(out_queue)
        sys.stdout = printer

        
    importlib.import_module(player_name)
    module = importlib.import_module(player_name+".controller")

    
    start = 0
    stop = 0
    return_queue.put(True)

    def perform_memory_checks():
        try:
            checkMemory()
        except MemoryError:
            print(traceback.format_exc())
            return ("Memory", -1, traceback.format_exc())

        try:
            checkVRAM()
        except MemoryError:
            print(traceback.format_exc())
            return (("GPU VRAM", -1, traceback.format_exc()))
        
        return None

    def controller_play(player_controller):
        try:
            board_state, player_parity, time_left = player_queue.get()
            if(not limit_resources):
                try:
                    turn_label = board_state.turn_count
                except AttributeError:
                    turn_label = "?"
                printer.set_turn(f"turn #{turn_label}")

            try:
                start = get_cur_time()
                def time_left_func():
                    return time_left - (get_cur_time() - start)
                player_move = player_controller.play(board_state, player_parity, time_left_func)         
                stop = get_cur_time()
            except:
                print(traceback.format_exc())
                return (None, -1, traceback.format_exc())

            memory_result = perform_memory_checks()
            if(memory_result != None):
                return memory_result
            
            return (player_move, stop-start, "")

        except:
            return ("Fail", -1, traceback.format_exc())

    def controller_bid(player_controller):
        try:
            board_state, player_parity, time_left = player_queue.get()
            if(not limit_resources):
                printer.set_turn("bid")

            try:
                start = get_cur_time()
                def time_left_func():
                    return time_left - (get_cur_time() - start)
                bid_value = player_controller.bid(board_state, player_parity, time_left_func)
                stop = get_cur_time()
            except:
                print(traceback.format_exc())
                return (None, -1, traceback.format_exc())

            memory_result = perform_memory_checks()
            if(memory_result != None):
                return memory_result

            return (bid_value, stop-start, "")
        except:
            return ("Fail", -1, traceback.format_exc())
        
    def controller_commentate(player_controller):
        
        try:
            if(not limit_resources):
                printer.set_turn("commentate")

            board_state, player_parity, time_left = player_queue.get()
            
            try:
                start = get_cur_time()
                def time_left_func():
                    return time_left - (get_cur_time() - start)
                commentary = player_controller.commentate(board_state, player_parity, time_left_func)
                stop = get_cur_time()
            except:
                return ("", -1,traceback.format_exc())
            
            memory_result = perform_memory_checks()
            if(memory_result != None):
                return ("", -1, memory_result[2])

            return (commentary, stop-start, "")
        except:
            print(traceback.format_exc())
            return ("", -1, traceback.format_exc())


    player_controller = None
    while True:
        func = player_queue.get()
        
        return_val = ()
        if(func == "construct"):
            try:
                if(not limit_resources):
                    printer.set_turn("construct")

                player_parity, time_left = player_queue.get()

                try:
                    start = get_cur_time()
                    def time_left_func():
                        return time_left - (get_cur_time() - start)
                    player_controller= module.PlayerController(player_parity, time_left_func)
                    stop = get_cur_time()


                    return_val = (True, stop-start, "")
                except:
                    return_val = (False, -1,traceback.format_exc())

                memory_result = perform_memory_checks()
                if(memory_result != None):
                    return_val = memory_result
                
                
            except:
                print(traceback.format_exc())
                return_val = ("Fail", -1, traceback.format_exc())
        elif(func == "play"):
            return_val = controller_play(player_controller)
        elif(func == "bid"):
            return_val = controller_bid(player_controller)
        elif(func == "commentate"):
            return_val = controller_commentate(player_controller)

        return_queue.put(return_val)
            


class PlayerProcess:
    def __init__(self, is_player_a, player_name, submission_dir, player_queue, return_queue, limit_resources, use_gpu, out_queue, user_name = None, group_name= None):
        self.process = Process(target = run_player_process, 
                               args = (player_name, submission_dir, player_queue, return_queue, limit_resources, use_gpu, out_queue, user_name, group_name))
        self.player_queue = player_queue
        self.return_queue = return_queue
        self.is_player_a = is_player_a
        self.limit_resources = limit_resources
    
    def start(self):
        self.process.start()


    #runs player construct command
    def run_timed_constructor(self, timeout, player_parity, extra_ret_time):

        self.player_queue.put("construct")
        self.player_queue.put((player_parity, timeout))
        try:
            ok, timer, message = self.return_queue.get(block = True, timeout = timeout + extra_ret_time) 

            if(ok == False):
                return False, message
            if(ok=="Memory" and timer == -1):
                return False, message
            if(ok=="Fail" and timer == -1):
                raise RuntimeError(f"Something went wrong while running player constructor.\n {message}")
            
            return timer < timeout, message
        except:
            print(traceback.format_exc())
            return False, "Timeout"
        
    def run_timed_bid(self, board_state, player_parity, timeout, extra_ret_time):
        self.player_queue.put("bid")
        self.player_queue.put((board_state, player_parity, timeout))

        try:
            bid_value, timer, message = self.return_queue.get(block = True, timeout = timeout + extra_ret_time) 

            if(bid_value == None):
                print("Player bid caused exception")
                return None, -1, message
            if(bid_value=="Memory" and timer == -1):
                print("Memory error")
                return None, -2, message
            if(bid_value=="Fail" and timer == -1):
                raise RuntimeError(f"Something went wrong while running player bid. \n{message}")
            
            if(timer < timeout):
                return bid_value, timer, message
            return None, timeout, "Timeout"
        except:
            print(traceback.format_exc())
            return None, timeout, "Timeout"

    #runs player play command
    def run_timed_play(self, board_state, player_parity, timeout, extra_ret_time):
        self.player_queue.put("play")
        self.player_queue.put((board_state, player_parity, timeout))

        try:
            actions, timer, message = self.return_queue.get(block = True, timeout = timeout + extra_ret_time) 

            if(actions == None):
                print("Player code caused exception")
                return None, -1, message
            if(actions=="Memory" and timer == -1):
                print("Memory error")
                return None, -2, message
            if(actions=="Fail" and timer == -1):
                raise RuntimeError(f"Something went wrong while running player move. \n{message}")
            
            if(timer < timeout):
                return actions, timer, message
            return None, timeout, "Timeout"
        except:
            print(traceback.format_exc())
            return None, timeout, "Timeout"
        
    #runs player commentate command
    def run_timed_commentate(self, board_state, player_parity, timeout, extra_ret_time):
        self.player_queue.put("commentate")
        self.player_queue.put((board_state, player_parity, timeout))

        try:
            commentary, timer, message = self.return_queue.get(block = True, timeout = timeout + extra_ret_time) 

            if(commentary == None):
                print("Player code caused exception")
                return "", -1, message
            if(commentary=="Memory" and timer == -1):
                print("Memory error")
                return "", -2, message
            if(commentary=="Fail" and timer == -1):
                raise RuntimeError(f"Something went wrong while running player move. \n{message}")
            
            if(timer < timeout):
                return commentary, timer, message
            return "", timeout, "Timeout"
        except:
            print(traceback.format_exc())
            return "", timeout, "Timeout"



    def terminate_process_and_children(self):
        import psutil
        # Find the process by PID
        pid = self.process.pid  
        parent_process = None
        children = None
        try:
            parent_process = psutil.Process(pid)
        except psutil.NoSuchProcess as e:
            print(f"Process has already been closed.")
        
        if(not parent_process is None):
            children = parent_process.children(recursive=True)

        # Kill the parent process
        if not parent_process is None and parent_process.is_running():
            try:
                parent_process.terminate()
            except psutil.NoSuchProcess as e:
                print(f"Process has already been closed.")
            except Exception as e:
                print(f"Error while killing process: {e}")    
        
        if not children is None:
            for child in children:
                if child.is_running():
                    try:
                        child.terminate()

                    except psutil.NoSuchProcess as e:
                        print(f"Process  does not exist.")
                    except Exception as e:
                        print(f"Error while killing process: {e}")

        if not parent_process is None and parent_process.is_running():
            try:
                parent_process.kill()   
            except psutil.NoSuchProcess:
                print(f"Process  does not exist.")
            except Exception as e:
                print(f"Error while killing process: {e}")  

        if not children is None:
            for child in children:
                if child.is_running():
                    try:
                        child.kill()   
                    except psutil.NoSuchProcess:
                        print(f"Process  does not exist.")
                    except Exception as e:
                        print(f"Error while killing process: {e}")


    def pause_process_and_children(self):
        # Find the process by PID
        if(self.limit_resources):
            import time
            import signal
            import os
            import psutil
            try:
                pid = self.process.pid
                parent_process = psutil.Process(pid)
                
                children = parent_process.children(recursive=True)
                
                # send sigstop to parent process
                if parent_process.is_running():
                    try:
                        os.kill(pid, signal.SIGSTOP)
                    except psutil.NoSuchProcess:
                        print(f"Process  does not exist.")
                    except Exception as e:
                        print(f"Error while killing process: {e}")    

                i = 0
                while(parent_process.status() == psutil.STATUS_RUNNING and i < 50):
                    time.sleep(0.001) 
                    i+=1
                if(parent_process.status() == psutil.STATUS_RUNNING):
                    os.kill(parent_process.pid, signal.SIGKILL)   

                for child in children:
                    if child.is_running():
                        try:
                            os.kill(child.pid, signal.SIGSTOP)
                        except psutil.NoSuchProcess:
                            print(f"Process  does not exist.")
                        except Exception as e:
                            print(f"Error while killing process: {e}")    
                
                for child in children:
                    i = 0
                    while(child.status() == psutil.STATUS_RUNNING and i < 50):
                        time.sleep(0.001) 
                        i+=1
                    if(child.status()== psutil.STATUS_RUNNING):
                        os.kill(child.pid, signal.SIGKILL)

            except:
                print("error pausing processes")


    def restart_process_and_children(self):
        if(self.limit_resources):  
            import psutil
            import os
            import time
            import signal      
            pid = self.process.pid
            parent_process = psutil.Process(pid)
            
            children = parent_process.children(recursive=True)

            try:

                for child in children:
                    if child.is_running():
                        try:
                            os.kill(child.pid, signal.SIGCONT)
                        except psutil.NoSuchProcess:
                            print(f"Process does not exist.")
                        except Exception as e:
                            print(f"Error while killing process: {e}") 

                for child in children:
                    i = 0
                    while(child.status() == psutil.STATUS_STOPPED and i < 50):
                        time.sleep(0.001) 
                        i+=1
        
                
                # send sigstop to parent process
                if parent_process.is_running():
                    try:
                        os.kill(pid, signal.SIGCONT)
                    except psutil.NoSuchProcess:
                        print(f"Process does not exist.")
                    except Exception as e:
                        print(f"Error while killing process: {e}")    

            
                i = 0
                while(parent_process.status() == psutil.STATUS_STOPPED and i < 50):
                    time.sleep(0.001) 
                    i+=1
            
                
            except:
                print("error restarting processes")
