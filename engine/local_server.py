import json

import threading
import socket
import json
import time
import psutil
from game_runner.gameplay import play_game
from game.outcome import Result
import os
import sys


def safe_close_socket(sock, do_shutdown=False):
    """Best-effort socket teardown that ignores expected close-time errors."""
    if sock is None:
        return

    if do_shutdown:
        try:
            sock.shutdown(socket.SHUT_RDWR)
        except OSError as ose:
            # Socket may already be closed or not connected.
            print(f"Socket shutdown error (may be expected if socket already closed): {ose}")

    try:
        sock.close()
    except OSError as ose:
        print(f"Error closing socket: {ose}")

def recv_message(conn):
    buffer = ""
    while True:
        try:
            data = conn.recv(1024).decode("utf-8")
            if not data:
                # Connection closed
                print("Connection closed by client")
                return None
            
            buffer += data
            if "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                try:
                    msg = json.loads(line)

                    if msg.get("type") == "terminate":
                        print("Terminate command received")
                        handle_termination(conn)
                        return  # exit listener
                except json.JSONDecodeError:
                    continue
        except ConnectionResetError:
            print("Connection reset by peer")
            return None
        except OSError as e:
            print(f"Socket error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error in recv_message: {e}")
            return None

def handle_termination(conn):
    """Perform full termination routine."""
    try:
        parent = psutil.Process(os.getpid())
        children = parent.children(recursive=True)
        for child in children:
            try:
                child.kill()   
            except psutil.NoSuchProcess:
                print(f"Process does not exist.")
            except Exception as e:
                print(f"Error while killing process: {e}")

        msg = json.dumps({"type": "terminated", "reason": "User requested termination"})
        conn.sendall((msg + "\n").encode("utf-8"))
        conn.close()
    finally:
        print("Exiting process...")
        sys.stdout.flush()
        os._exit(0)  

def start_game(args, sock):
    import os
    import time
    from game_runner.gameplay import play_game
    from game.outcome import Result

    a_name = os.path.basename(args.a_dir)
    b_name = os.path.basename(args.b_dir)

    a_sub = os.path.dirname(args.a_dir)
    b_sub = os.path.dirname(args.b_dir)

    print(a_sub)
    print(b_sub)

    if not "controller.py" in os.listdir(args.a_dir):
        print("Error: Bot 1 directory incorrect.")
        return

    if not "controller.py" in os.listdir(args.b_dir):
        print("Error: Bot 2 directory incorrect.")
        return

    map_string = args.map_string
    
    if(map_string is None):
        print("map not found")
        return

    sim_time = time.perf_counter()
    outcome = play_game(a_sub, b_sub, a_name, b_name, 
                        display_game=False, clear_screen=True, record=True, 
                        limit_resources=False, map_string=map_string, output_stream=sock)

    if outcome.result == Result.PLAYER_1:
        print("Player A won by", outcome.reason.name)
    elif outcome.result == Result.PLAYER_2:
        print("Player B won by", outcome.reason.name)
    else:
        print("Tie by", outcome.reason.name)

    

    sim_time = time.perf_counter() - sim_time
    turn_count = outcome.get_num_turns()
    print(f"{sim_time:.3f} seconds elapsed to simulate {turn_count} rounds.")

    try:
        print(args.output_dir)
        with open(args.output_dir, 'w') as fp:
            fp.write(outcome.get_history_json())
    except:
        print("Failed to write game to output directory.")


def main():
    import os    
    import argparse
    import sys
    
    import traceback
    import socket
    import threading

    
    
    try:    
        print(os.getcwd())
        print(sys.path)
        parser = argparse.ArgumentParser(description='Run a game between two players')

        parser.add_argument('--a_dir', '-a', type=str, help='Directory of player A submission')
        parser.add_argument('--b_dir', '-b', type=str, help='Directory of player B submission')
        parser.add_argument('--map_string', '-m', type=str, help='Name of map to play')
        parser.add_argument('--output_dir', '-o', type=str, help='Output Directory')
        parser.add_argument('--output_port', '-p', type=str, help='Output Directory')

        args = parser.parse_args()

        port = int(args.output_port)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(("127.0.0.1", port))


        print("waiting for connection")
        sock.listen(1)
        sock.settimeout(1.0) 
        finaldict={}
        conn = None
        try:
            while True:
                try:
                    conn, addr = sock.accept()
                    print("Connected:", addr)
                    break
                except socket.timeout:
                    # raise TimeoutError # maybe should have this
                    pass  # just loop again

            listener_thread = threading.Thread(target=recv_message, args=(conn,), daemon=True)
            listener_thread.start()

            start_game(args, conn)

            finaldict = {
                "type": "game_complete",
                "success": True
            }
        except Exception as e:
            print(f"Error during game execution: {e.format_exc()}")

        except:
            finaldict = {
                "type": "game_complete",
                "success": False
            }
        
        try:
            if conn is not None:
                message = (json.dumps(finaldict)+"\n").encode("utf-8")
                conn.sendall(message)
        finally:
            # Accepted client socket should be shutdown+closed; listening socket should be closed.
            safe_close_socket(conn, do_shutdown=True)
            safe_close_socket(sock, do_shutdown=False)
       
    except:
        print(traceback.format_exc())
        print("Game crashed due to unknown reason.")


if __name__=="__main__":
    main()
