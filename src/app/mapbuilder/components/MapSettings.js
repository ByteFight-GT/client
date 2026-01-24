function MapSettings({
  mapHeight, handleHeightChange,
  mapWidth, handleWidthChange,
  powerupRate, handlePowerupRateChange,
  powerupNum, handlePowerupNumChange,
  hillID, handleHillIDChange
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-zinc-50">Map Settings</p>
      <div className="flex flex-row gap-2 items-center justify-end w-full">
        <label htmlFor="mapHeight" className="block text-zinc-300">Map Height</label>
        <input
          id="mapHeight"
          type="number"
          value={mapHeight}
          onChange={handleHeightChange}
          className="nav-input px-2 py-1 border rounded max-w-24"
          placeholder="Map Height"
        />
      </div>

      <div className="flex flex-row gap-2 items-center justify-end w-full">
        <label htmlFor="mapWidth" className="block text-zinc-300">Map Width</label>
        <input
          id="mapWidth"
          type="number"
          value={mapWidth}
          onChange={handleWidthChange}
          className="nav-input px-2 py-1 border rounded max-w-24"
          placeholder="Map Width"
        />
      </div>

      <div className="flex flex-row gap-2 items-center justify-end w-full">
        <label htmlFor="powerupRate" className="block text-zinc-300">Spawn Rate</label>
        <input
          id="powerupRate"
          type="number"
          value={powerupRate}
          onChange={handlePowerupRateChange}
          className="nav-input px-2 py-1 border rounded max-w-24"
          placeholder="Powerup Spawn Rate"
        />
      </div>

      <div className="flex flex-row gap-2 items-center justify-end w-full">
        <label htmlFor="Powerup Num" className="block text-zinc-300">Spawn Count</label>
        <input
          id="powerupNum"
          type="number"
          value={powerupNum}
          onChange={handlePowerupNumChange}
          className="nav-input px-2 py-1 border rounded max-w-24"
          placeholder="Powerup Spawn #"
        />
      </div>

      <div className="flex flex-row gap-2 items-center justify-end w-full">
        <label htmlFor="Hill ID" className="block text-zinc-300">Hill ID</label>
        <input
          id="hillID"
          type="number"
          value={hillID}
          onChange={handleHillIDChange}
          className="nav-input px-2 py-1 border rounded max-w-24"
          placeholder="Hill ID"
        />
      </div>
    </div>
  );
}

export default MapSettings;
