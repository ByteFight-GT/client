import { useEffect, useState } from 'react';
import MapSettings from './MapSettings';
import ShowSpawn from './ShowSpawn';
import MapBuilderVis from './MapBuilderVis';
import CellSelector from './CellSelector'
import SymmetrySelector from './SymmetrySelector'
import { Button } from '@/components/ui/button';
import Selector from './Selector';
import { useToast } from '@/hooks/use-toast'

const GridValues = {
  EMPTY: 0,
  WALL: 1,
  APPLE: 2,
  PLAYER_1: 3,
  PLAYER_2: 5,
  HILL: 7,
}

export default function MapBuilder() {
  
  const [showSpawn, setShowSpawn] = useState(true);
  const [aSpawn, setASpawn] = useState([-1, -1]);
  const [bSpawn, setBSpawn] = useState([-1, -1]);
  const [mapHeight, setMapHeight] = useState(20);
  const [mapWidth, setMapWidth] = useState(20);
  const [walls, setWalls] = useState(null);  // Array to store wall positions, initially empty
  const [cellType, setCellType] = useState(GridValues.EMPTY);
  const [powerupRate, setPowerupRate] = useState(50);
  const [powerupNum, setPowerupNum] = useState(1);
  const [symmetry, setSymmetry] = useState("Vertical");
  const [canvasRerender, setCanvasRerender] = useState(false)
  const [mapName, setMapName] = useState("")
  const [hillGrid, setHillGrid] = useState(null) // Array to store wall positions, initially empty
  const [hillID, setHillID] = useState(1)

  const { toast } = useToast();

  const min_map = 1;
  const max_map = 64;
  const min_powerup_num = 1;
  const max_powerup_num = 1000;
  const min_powerup_rate = 1;
  const max_powerup_rate = 200;
  const min_hill_id = 1;
  const max_hill_id = 1000;

  const reflect = (x, y) => {
    if (symmetry == "Vertical") {

      return [(mapWidth - 1) - x, y];

    } else if (symmetry == "Horizontal") {
      return [x, (mapHeight - 1) - y];

    } else if (symmetry == "Origin") {
      return [(mapWidth - 1) - x, (mapHeight - 1) - y];

    }

  }

  const handleCellChange = (event) => {
    const value = event.target.value;

    switch (value) {
      case "Space":
        setCellType(GridValues.EMPTY);
        break;
      case "Wall":
        setCellType(GridValues.WALL);
        break;
      case "Player 1":
        setCellType(GridValues.PLAYER_1);
        break;
      case "Player 2":
        setCellType(GridValues.PLAYER_2);
        break;
      case "Hill":
        setCellType(GridValues.HILL)
        break;
    }
  };


  const handleHeightChange = (event) => {
    const value = event.target.value ? parseInt(event.target.value, 10) : 0;
    const f = Math.max(Math.min(max_map, value), min_map)
    setMapHeight(f);
    setWalls(new Array(f).fill().map(() => new Array(mapWidth).fill(false)));
    setHillGrid(new Array(f).fill().map(() => new Array(mapWidth).fill(0)));
    setASpawn([-1, -1])
    setBSpawn([-1, -1])
    setHillID(1)
  };

  const handleWidthChange = (event) => {
    const value = event.target.value ? parseInt(event.target.value, 10) : 0;
    const f = Math.max(Math.min(max_map, value), min_map)
    setMapWidth(f);
    setWalls(new Array(mapHeight).fill().map(() => new Array(f).fill(false)));
    setHillGrid(new Array(mapHeight).fill().map(() => new Array(f).fill(0)));
    setASpawn([-1, -1])
    setBSpawn([-1, -1])
    setHillID(1)
  };

  const handlePowerupRateChange = (event) => {
    const value = event.target.value ? parseInt(event.target.value, 10) : 0;
    setPowerupRate(Math.max(Math.min(max_powerup_rate, value), min_powerup_rate))
  };

  const handlePowerupNumChange = (event) => {
    const value = event.target.value ? parseInt(event.target.value, 10) : 0;
    setPowerupNum(Math.max(Math.min(max_powerup_num, value), min_powerup_num))
  };

  const handleShowSpawn = (event) => {
    setShowSpawn(event.target.checked);
    setCanvasRerender(!canvasRerender)
  };

  const handleHillIDChange = (event) => {
    const value = event.target.value ? parseInt(event.target.value, 10) : 0;
    setHillID(Math.max(Math.min(max_hill_id, value), min_hill_id))
  };

  const handleChangeMapName = (event) => {
    setMapName(event.target.value)
  };

  const handleSymmetryChange = (event) => {
    const value = event.target.value;
    setSymmetry(value);
    setWalls(new Array(mapHeight).fill().map(() => new Array(mapWidth).fill(false)));
    setHillGrid(new Array(mapHeight).fill().map(() => new Array(mapWidth).fill(0)));
    setASpawn([-1, -1])
    setBSpawn([-1, -1])
    setHillID(1)

  };

  const [mapJustSaved, setMapJustSaved] = useState(true);

  const handleSaveMap = async () => {
    const invalidChars = /[<>:"/\\|?*]/;
    if (mapName != "" && !invalidChars.test(mapName)) {
      let mapPairs = await window.electron.storeGet("maps");
      let generated_string = getMapString();

      mapPairs[mapName] = generated_string;

      try {
        await window.electron.storeSet("maps", mapPairs);  // Send data to Electron to write to file
        toast({
          title: "Success",
          description: "Map saved successfully!",
        })
        setMapJustSaved(true);
      } catch (error) {
        console.error('Error:', error);
      }

    }


  }

  const getMapString = () => {
    let parts = [

    ]

    

    let wallarr = []

    for (let i = 0; i < mapHeight; i++) {
      for (let j = 0; j < mapWidth; j++) {
        if (walls[i][j]) {
          wallarr.push("1");
        } else {
          wallarr.push("0");
        }
      }
    }
    let wallstring = wallarr.join("");


    let hillDict = {}
    let hillids = []
    let fullHills = []

    for (let i = 0; i < mapHeight; i++) {
      for (let j = 0; j < mapWidth; j++) {
        if (hillGrid[i][j] > 0) {
          const id = hillGrid[i][j]
          if(!(id in hillDict)){
            hillDict[id] = []
          }
          hillDict[id].push(i+"")
          hillDict[id].push(j+"")
        }
      }
    }

    for(const id in hillDict){
      hillids.push(id+"")
      fullHills.push(hillDict[id].join(","))
    }
    let hillIDstring = hillids.join("")
    let hillsString = fullHills.join("_")
    

    parts.push(mapHeight.toString() + "," + mapWidth.toString());
    parts.push(aSpawn[0].toString() + "," + aSpawn[1].toString());
    parts.push(bSpawn[0].toString() + "," + bSpawn[1].toString());
    parts.push(wallstring);
    parts.push(hillIDstring);
    parts.push(hillsString);
    parts.push("0");
    parts.push(powerupRate.toString() + "," + powerupNum.toString() + "," + symmetry);
    const generated_string = parts.join("#")

    return generated_string;
  }

  const handleGenerateMap = () => {

    let generated_string = getMapString();
    navigator.clipboard.writeText(generated_string).then(() => {
      toast({
        title: "Success",
        description: "Map string copied to clipboard!",
      })
    });
    return generated_string;

  }


  const setTile = (r, c) => {
    if (cellType == GridValues.EMPTY) {
      if (r == aSpawn[0] && c == aSpawn[1]) {
        setASpawn([-1, -1])
        setBSpawn([-1, -1])

      } else if (r == bSpawn[0] && c == bSpawn[1]) {
        setASpawn([-1, -1])
        setBSpawn([-1, -1])
      } else if (walls != null && walls[r][c]) {

        walls[r][c] = false;
        const reflection = reflect(r, c);
        walls[reflection[0]][reflection[1]] = false;
      } else if (hillGrid != null) {
        hillGrid[r][c] = 0;
      }
    } else if (cellType == GridValues.PLAYER_1) {
      const reflection = reflect(r, c);
      if (reflection[0] != r || reflection[1] != c) {
        if (walls != null && walls[r][c]) {
          walls[r][c] = false;
          walls[reflection[0]][reflection[1]] = false;
        } 
        if (reflection[0] != r || reflection[1] != c) {
          setASpawn([r, c])
          setBSpawn(reflection)

          console.log(aSpawn)
        }
      }


    } else if (cellType == GridValues.PLAYER_2) {
      const reflection = reflect(r, c);
      if (reflection[0] != r || reflection[1] != c) {
        if (walls != null && walls[c][r]) {
          walls[r][c] = false;
          walls[reflection[0]][reflection[1]] = false;
        } 
        if (reflection[0] != r || reflection[1] != c) {
          setBSpawn([r, c])
          setASpawn(reflection)
        }
      }

    } else if (cellType == GridValues.WALL) {
      const reflection = reflect(r, c);
      if (r == aSpawn[0] && c == aSpawn[1]) {
        setASpawn([-1, -1])
        setBSpawn([-1, -1])
      } else if (r == bSpawn[0] && c == bSpawn[1]) {
        setASpawn([-1, -1])
        setBSpawn([-1, -1])
      } else if (hillGrid != null) {
        hillGrid[r][c] = 0
      }
      walls[r][c] = true;
      walls[reflection[0]][reflection[1]] = true;
    } else if (cellType == GridValues.HILL) {
      const reflection = reflect(r, c);
      if (walls != null && walls[c][r]) {
        walls[r][c] = 0;
        walls[reflection[0]][reflection[1]] = 0;
      } 

      hillGrid[r][c] = hillID
    } 
    setCanvasRerender(!canvasRerender)
  }

  useEffect(() => {

    if (walls == null) {
      setWalls(new Array(mapHeight).fill().map(() => new Array(mapWidth).fill(false)));
    }
    if (hillGrid == null) {
      setHillGrid(new Array(mapHeight).fill().map(() => new Array(mapWidth).fill(0)));
    }
  }, []);

  const [map, setMap] = useState(null);
  const [maps, setMaps] = useState({});


  const handleDeleteMap = async () => {
    await window.electron.deleteMap(map);

    delete maps[map]

    setMaps(maps)
    toast({
      title: "Success",
      description: "Map deleted!",
    })
    setMap(null);
  }

  const handleDeleteMaps = async () => {
    await window.electron.deleteMaps();
    const mapPairs = await window.electron.storeGet("maps")
    setMaps(mapPairs)
    setMap(null);
    toast({
      title: "Success",
      description: "All custom maps deleted!",
    })

  }

  useEffect(() => {
    if (!mapJustSaved) {
      return;
    }
    const start = async () => {
      const mapPairs = await window.electron.storeGet("maps")
      setMaps(mapPairs)
      setMapJustSaved(false);
    }
    start();
  }, [mapJustSaved]);

  return (
    <div className="flex-grow flex flex-col lg:flex-row items-center justify-center bg-zinc-900 gap-8 pt-4 pb-8" >
      <div className="bg-zinc-800 p-4 flex flex-col gap-5 items-center justify-center border rounded-lg mt-14">
        <div className="flex flex-col items-center justify-start gap-3 w-full pb-5 border-b border-zinc-700">
          <p className="text-lg font-bold text-zinc-50">Editor Settings</p>
          <div className="flex flex-row gap-2 items-center justify-end w-full">
            <p htmlFor="appleRate" className="block text-zinc-300">Tile to Place</p>
            <CellSelector handleCellChange={handleCellChange} />
          </div>
          <div className="flex flex-row gap-2 items-center justify-end w-full">
            <p htmlFor="appleRate" className="block text-zinc-300">Symmetry</p>
            <SymmetrySelector handleSymmetryChange={handleSymmetryChange} />
          </div>
          <ShowSpawn showSnakeStart={showSpawn} handleShowSpawn={handleShowSpawn} />
        </div>
        <div className="flex flex-col items-center justify-start gap-3 pb-5 border-b border-zinc-700">
          <MapSettings
            mapHeight={mapHeight}
            handleHeightChange={handleHeightChange}
            mapWidth={mapWidth}
            handleWidthChange={handleWidthChange}
            powerupRate={powerupRate}
            handlePowerupRateChange={handlePowerupRateChange}
            powerupNum={powerupNum}
            handlePowerupNumChange={handlePowerupNumChange}
            hillID={hillID}
            handleHillIDChange={handleHillIDChange}
          />
        </div>
        <div className="flex flex-col items-center justify-start gap-2 w-full">
          <p className="text-lg font-bold text-zinc-50">Delete Maps</p>
          <Selector dict={Object.keys(maps)} setValue={setMap} message={"Select"} label={"Map"} />
          <div className="w-full flex flex-row gap-2 justify-center items-center">
            <Button
              onClick={handleDeleteMap}
              disabled={!map}
              variant="destructive"
              className="px-4 py-2">
              Delete
            </Button>

            <Button
              onClick={handleDeleteMaps}
              disabled={Object.keys(maps).length === 0}
              variant="destructive"
              className="px-4 py-2">
              Delete All Custom
            </Button>
          </div>
        </div>
      </div>


      <div className="flex flex-col gap-4 justify-center items-center mr-10">
        <div className="flex flex-row gap-4 items-center justify-stretch">
          <input
            type="text"
            value={mapName}
            onChange={handleChangeMapName}
            className="nav-input px-2 py-1 border rounded h-11"
            placeholder="Map Name"
          />
          <Button
            onClick={handleSaveMap}
            className="px-4 py-2 bg-yellow-500 text-black font-bold  rounded hover:bg-yellow-400"
            disabled={mapName == ""}
          >Save Map</Button>
          <Button
            onClick={handleGenerateMap}
            className="px-4 py-2 bg-zinc-700 text-zinc-200 rounded hover:bg-zinc-600"
          >Copy Map String</Button>

        </div>
        <MapBuilderVis
          showSpawn={showSpawn}
          aSpawn={aSpawn}
          bSpawn={bSpawn}
          mapHeight={mapHeight}
          mapWidth={mapWidth}
          walls={walls}
          hillGrid={hillGrid}
          cellType={cellType}
          setTile={setTile}
          rerender={canvasRerender}

        />
      </div>
    </div>
  );
}