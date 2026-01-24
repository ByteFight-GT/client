export class Map{
    dim_x: number;
    dim_y: number;
    start_a: [number, number];
    start_b: [number, number];
    start_size: number;
    min_player_size: number;
    apple_timeline: number[][];
    cells_walls: number[][];
    cells_portals: number[][];

    constructor(map_string: string){
        
        let infos:string[] = map_string.split("#");
        let info_dim:string[] = infos[0].split(",");
        this.dim_x = parseInt(info_dim[0]);
        this.dim_y = parseInt(info_dim[1]);

        let info_a:string[] = infos[1].split(",")
        let info_b:string[] = infos[2].split(",")
        this.start_a = [parseInt(info_a[0]), parseInt(info_a[1])]
        this.start_b = [parseInt(info_b[0]), parseInt(info_b[1])]

        this.start_size = parseInt(infos[3])
        this.min_player_size = parseInt(infos[4])

        let portals:string[] = infos[5].split("_");
        this.cells_portals = new Array(this.dim_y).fill(null).map(
            () => new Array(this.dim_x).fill(-1));


        for(let i = 0; i< portals.length; i++){
            let portal:string[]= portals[i].split(",")
            if(portal.length ==4){
                let x1: number = parseInt(portal[0])
                let y1: number = parseInt(portal[1])
                let x2: number = parseInt(portal[2])
                let y2: number = parseInt(portal[3])

                this.cells_portals[y1][x1] = (this.dim_x * y2 + x2) 

            }
            
        }


        let apples:string[] = infos[6].split("_")
 
        this.apple_timeline = new Array(apples.length).
        fill(null).map(
            () => new Array(3).fill(0));

        for(let i = 0; i< apples.length; i++){
            let apple:string[] = apples[i].split(',');
            
            for(let j = 0; j < 3; j++){
                this.apple_timeline[i][j] = parseInt(apple[j]);
            }   
        }

        this.cells_walls = new Array(this.dim_y).fill(null).map(
            () => new Array(this.dim_x).fill(0));

        for(let i = 0; i< this.dim_y; i++){
            for(let j = 0; j < this.dim_x; j++){
                this.cells_walls[i][j] = parseInt(infos[7][i*this.dim_x+j]);
            }   
        }
        
        

    }


    get_enum_map(round_num: number): number[][] {
        let enum_map:number[][] = new Array(this.dim_y).fill(null).map(
            () => new Array(this.dim_x).fill(0));

        for(let i = 0; i< this.dim_y; i++){
            for(let j = 0; j< this.dim_x; j++){
                for(let k = 0; k < this.apple_timeline.length; k++){
                    if(this.apple_timeline[k][0] == round_num){
                        let x = this.apple_timeline[k][1]
                        let y = this.apple_timeline[k][2]
                        enum_map[y][x] = 2;
                    }
                    
                }

                if(this.cells_walls[i][j]){
                    enum_map[i][j] = 1;
                }else{
                    enum_map[i][j] = 0;
                }

            }

        }
        
        if(this.start_a[0]!=-1){
            enum_map[this.start_a[1]][this.start_a[0]] = 3;
            
        }
        if(this.start_b[0]!=-1){
            enum_map[this.start_b[1]][this.start_b[0]] = 5;
        } 
        return enum_map;
    }
}




class Snake{
    apples_eaten: number;
    head_loc: [number, number];
    dir:Action;

    constructor(start_loc:[number, number], start_size:number){
        this.apples_eaten = 0;
        this.head_loc = start_loc;
        this.dir = Action.NORTH;
    }
        
}

export class Board {
    map: Map;
    cells_a: number[][];
    cells_b: number[][];
    cells_apples: number[][];
    cells_a_traps:number[][];
    cells_b_traps: number[][];
    is_as_turn: boolean;
    a_time: number;
    b_time: number;
    apple_counter: number;
    turn_count:number;

    snake_a:Snake;
    snake_b:Snake;

    constructor(map: Map, a_start:boolean, start_time:number, a_length:number, b_length:number){
        this.map = map;
        this.cells_a = new Array(map.dim_y).fill(null).map(
            () => new Array(map.dim_x).fill(0));
        this.cells_b = new Array(map.dim_y).fill(null).map(
            () => new Array(map.dim_x).fill(0));
        this.cells_apples = new Array(map.dim_y).fill(null).map(
            () => new Array(map.dim_x).fill(0));
        this.cells_a_traps = new Array(map.dim_y).fill(null).map(
            () => new Array(map.dim_x).fill(0));
        this.cells_b_traps = new Array(map.dim_y).fill(null).map(
            () => new Array(map.dim_x).fill(0));
            

                

        this.is_as_turn = a_start;
        this.a_time = start_time;
        this.b_time = start_time;
        this.apple_counter = 0;
        this.turn_count = 0;

        this.snake_a = new Snake([map.start_a[0], map.start_a[1]], map.start_size);
        this.snake_b = new Snake([map.start_b[0], map.start_b[1]], map.start_size);

        this.cells_a[this.map.start_a[1]][this.map.start_a[0]] = 1
        this.cells_b[this.map.start_b[1]][this.map.start_b[0]] = 1

        this.spawn_apples()
    }

    get_portal(x: number, y:number):[number, number] {
        if(this.map.cells_portals[y][x] >=0){
            let num:number = this.map.cells_portals[y][x];
            return [num %this.map.dim_x, Math.floor(num/this.map.dim_x)]
        }
        return [-1, -1]
        
    }

    play_turn(turn: Action[],cells_gained:number[][], cells_lost:number[][], traps_created:number[][], traps_lost:number[][], time:number): void{            
        if(this.is_as_turn){
            if(Array.isArray(turn)){
                turn.forEach((action, index)=>{
                    if(action != Action.TRAP){
                        this.snake_a.dir = action;
                    }
                    
                    
                })
            } else{
                this.snake_a.dir = turn;

            }

            

            cells_gained.forEach((cell, index)=>{
                this.cells_a[cell[1]][cell[0]]++;
                this.snake_a.head_loc = [cell[0], cell[1]]

                if(this.cells_apples[cell[1]][cell[0]] > 0){
                    this.snake_a.apples_eaten+=1;
                    this.cells_apples[cell[1]][cell[0]] = 0;

                    let portal:[number, number] = this.get_portal(cell[0], cell[1])

                    if(portal[0]!= -1){
                        
                        this.cells_apples[portal[1]][portal[0]] = 0;
                    }
                }

            })

            
            

            cells_lost.forEach((cell, index)=>{
                this.cells_a[cell[1]][cell[0]]--;
            })
            traps_created.forEach((cell, index)=>{
                this.cells_a[cell[1]][cell[0]]--;
                this.cells_a_traps[cell[1]][cell[0]] = 1;
                
                let portal:[number, number] = this.get_portal(cell[0], cell[1])

                if(portal[0]!= -1){
                    this.cells_a_traps[portal[1]][portal[0]] = 1;
                }
            })

            this.a_time-=time;
            
        } else{
            if(Array.isArray(turn)){
                turn.forEach((action, index)=>{
                    if(action != Action.TRAP){
                        this.snake_b.dir = action;
                    }
                    
                    
                })
            } else{
                this.snake_b.dir = turn;

            }

            cells_gained.forEach((cell, index)=>{
                this.cells_b[cell[1]][cell[0]]++;
                this.snake_b.head_loc = [cell[0], cell[1]]

                if(this.cells_apples[cell[1]][cell[0]] > 0){
                    this.snake_b.apples_eaten+=1;
                    this.cells_apples[cell[1]][cell[0]] = 0;

                    console.log(this.turn_count)

                    let portal:[number, number] = this.get_portal(cell[0], cell[1])

                    console.log(portal)


                    if(portal[0]!= -1){
                        this.cells_apples[portal[1]][portal[0]] = 0;
                    }
                }
            })
            

            cells_lost.forEach((cell, index)=>{
                this.cells_b[cell[1]][cell[0]]--;
            })
            traps_created.forEach((cell, index)=>{
                this.cells_b[cell[1]][cell[0]]--;
                this.cells_b_traps[cell[1]][cell[0]] = 1;

                let portal:[number, number] = this.get_portal(cell[0], cell[1])
                if(portal[0]!= -1){
                    this.cells_b_traps[portal[1]][portal[0]] = 1;
                }
                
            })

            this.b_time-=time;

        }  
        
        traps_lost.forEach((cell, index)=>{
            this.cells_a_traps[cell[1]][cell[0]] = 0;
            this.cells_b_traps[cell[1]][cell[0]] = 0;


            let portal:[number, number] = this.get_portal(cell[0], cell[1])
            if(portal[0]!= -1){
                this.cells_a_traps[portal[1]][portal[0]] = 0;
                this.cells_b_traps[portal[1]][portal[0]] = 0;
            }
        })

    }

    spawn_apples(): void {
        while(this.apple_counter < this.map.apple_timeline.length 
            && this.map.apple_timeline[this.apple_counter][0] <= 
            this.get_turn_num()){

            let x:number = this.map.apple_timeline[this.apple_counter][1]
            let y:number = this.map.apple_timeline[this.apple_counter][2]

            this.cells_apples[y][x] = 1
            this.apple_counter++;

            let portal:[number, number] = this.get_portal(x, y)

            if(portal[0]!= -1){
                this.cells_apples[portal[1]][portal[0]] = 1;
            }
}
    }

    next_turn(): void {
        this.is_as_turn = !this.is_as_turn;
        this.turn_count++;

        this.spawn_apples()

        
    }

    get_turn_num(): number {
        return this.turn_count;
    }

    get_portal_map(): number[][] {
        let portal_map:number[][] =  new Array(this.map.dim_y).fill(null).map(
            () => new Array(this.map.dim_x).fill(0));
        
        for(let i = 0; i< this.map.dim_y; i++){
            for(let j = 0; j< this.map.dim_x; j++){
                portal_map[i][j] = this.map.cells_portals[i][j]
            }
        }
        return portal_map
    }


    get_trap_map(): number[][] {
        let trap_map:number[][] = new Array(this.map.dim_y).fill(null).map(
            () => new Array(this.map.dim_x).fill(0));

        for(let i = 0; i< this.map.dim_y; i++){
            for(let j = 0; j< this.map.dim_x; j++){
                trap_map[i][j] = 1 * this.cells_a_traps[i][j] + 2 * this.cells_b_traps[i][j]
            }
        }

        return trap_map


    }

    get_apple_map(): number[][] {
        let apple_map:number[][] = new Array(this.map.dim_y).fill(null).map(
            () => new Array(this.map.dim_x).fill(0));   

        for(let i = 0; i< this.map.dim_y; i++){
            for(let j = 0; j< this.map.dim_x; j++){
                apple_map[i][j] = this.cells_apples[i][j]
            }
        }
        return apple_map
    
    }

    get_occupancy_map(): number[][] {
        let enum_map:number[][] = new Array(this.map.dim_y).fill(null).map(
            () => new Array(this.map.dim_x).fill(0));

        for(let i = 0; i< this.map.dim_y; i++){
            for(let j = 0; j< this.map.dim_x; j++){
                if(this.map.cells_walls[i][j]){
                    enum_map[i][j] = 1;
                }
                else if(this.cells_a[i][j]>0){
                    if(this.snake_a.head_loc[0]==j && this.snake_a.head_loc[1]==i){
                        enum_map[i][j] = 3;
                    } else{
                        enum_map[i][j] = 4;
                    }
                }else if(this.cells_b[i][j]>0){
                    if(this.snake_b.head_loc[0]==j && this.snake_b.head_loc[1]==i){
                        enum_map[i][j] = 5;
                    } else{
                        enum_map[i][j] = 6;
                    }
                } else{
                    enum_map[i][j] = 0;
                }
                
            
            }

        }
        return enum_map;
    }

    
}

export enum Action{
    NORTH = 0,
    NORTHEAST = 1,
    EAST = 2,
    SOUTHEAST = 3,
    SOUTH = 4,
    SOUTHWEST = 5,
    WEST = 6,
    NORTHWEST = 7,
    TRAP = 8
}


export enum Result {
    PLAYER_A = 0,
    PLAYER_B = 1,
    TIE = 2,
    ERROR = 3
}
