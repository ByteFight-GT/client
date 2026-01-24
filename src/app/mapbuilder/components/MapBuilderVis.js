import { useEffect, useRef, useState } from 'react';

// NOTE: WHEN CONVERTING MOUSEX,MOUSEY to TILE COORDS, NEED TO SWAP
// SAME GOES FOR WHEN CONVERTING BACK FROM TILE COORDS TO CANVAS

export default function MapBuilderVis({
  showSpawn, 
  aSpawn,
  bSpawn,
  mapHeight, mapWidth, 
  walls, hillGrid,
  cellType,
  setTile,
  rerender


}) {
  const canvasRef = useRef(null);
  
  const [mouseCellX, setMouseCellX] = useState(-1); 
  const [mouseCellY, setMouseCellY] = useState(-1); 
  const [cellSize, setCellSize] = useState(30);

  

  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
  
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
  
      // Check if mouse is over the rectangle
      setMouseCellX(Math.floor(offsetX/cellSize));
      setMouseCellY(Math.floor(offsetY/cellSize));
    };
  
    const handleMouseOut = () => {
      setMouseCellX(-1);
      setMouseCellY(-1);
    };
  
    const handleClick = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
  
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
  
      const cellX = Math.floor(offsetX/cellSize);
      const cellY = Math.floor(offsetY/cellSize);

  
      setTile(cellY, cellX);
    };
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const maxSize = 640
    let cellCalc = Math.min(maxSize/mapWidth, maxSize/mapHeight)
    const minSize = 15
    cellCalc = Math.max(cellCalc, minSize)
    setCellSize(cellCalc)

    const width = mapWidth * cellSize;
    const height = mapHeight * cellSize;

    canvas.width = width;
    canvas.height = height;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
    canvas.addEventListener('click', handleClick);

    const drawTile = (r, c, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        ctx.strokeStyle = 'black';
        if(c==mouseCellX && r == mouseCellY){
          ctx.lineWidth = 2; 
        } else{
          ctx.lineWidth = 0.25; 
        }
        ctx.strokeRect(
          c*cellSize+(ctx.lineWidth/2), 
          r*cellSize+(ctx.lineWidth/2), 
          cellSize-(ctx.lineWidth), 
          cellSize-(ctx.lineWidth)
        );
        
    }

    const drawHill = (r, c) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(
        c * cellSize + cellSize / 2,
        r * cellSize + cellSize / 2,
        cellSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();

     }

    const drawPlayer = (r, c, color, direction) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          c * cellSize + cellSize / 2,
          r * cellSize + cellSize / 2,
          cellSize / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
       
        function drawEyes(r1, c1, r2, c2) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(c1 * cellSize, r1 * cellSize, 4, 0, Math.PI * 2);
            ctx.arc(c2 * cellSize, r2 * cellSize, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(c1 * cellSize, r1 * cellSize, 2, 0, Math.PI * 2);
            ctx.arc(c2 * cellSize, r2 * cellSize, 2, 0, Math.PI * 2);
            ctx.fill();
          }
       }

       const drawWall = (r, c) => {
        ctx.fillStyle = 'black';
        ctx.fillRect(c * cellSize,r * cellSize, cellSize, cellSize);
       }

       const drawCell = (r, c) => {
          if(hillGrid != null && hillGrid[r][c] != 0){
            drawHill(r, c)
          }

          if(walls != null && walls[r][c]){
            drawWall(r, c);
          }
          else if(showSpawn && r == aSpawn[0] && c == aSpawn[1]){
            drawPlayer(r, c, 'green', Action.NORTH);
          }
          else if(showSpawn && r == bSpawn[0] && c == bSpawn[1]){
            drawPlayer(r, c, 'blue', Action.NORTH);
          }
      }

    for (let r = 0; r < mapHeight; r++) {
        for (let c = 0; c < mapWidth; c++) {
            drawTile(r, c, '#B19E4E');
        }
    }

    for (let r = 0; r < mapHeight; r++) {
        for (let c = 0; c < mapWidth; c++) {
            drawCell(r, c);
        }
    }
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseout', handleMouseOut);
      canvas.removeEventListener('click', handleClick);
    };
    
  }, [
    aSpawn, 
    bSpawn, 
    mapHeight, 
    mapWidth, 
    walls, 
    hillGrid,
    mouseCellX,
    mouseCellY,
    rerender
  ]);

  return (
    <div className="flex justify-center items-center bg-gray-100 w-fit h-fit">
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="border border-gray-300 bg-white"
      />
    </div>
  );
}