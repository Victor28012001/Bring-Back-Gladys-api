import fs from "fs";

function generateLevel({
  levelName = "Lab Level",
  gridSize = 11,
  floors = 1,
  enemyTypes = ["lurker", "chaser"],
  maxEnemies = 15,
  keycardRoomCount = 1,
  lockedDoorCount = 3,
}) {
  // Helpers
  const getRandomPosition = () =>
    [
      Math.floor(Math.random() * gridSize) - Math.floor(gridSize / 2),
      0,
      Math.floor(Math.random() * gridSize) - Math.floor(gridSize / 2),
    ];

  const positionsEqual = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

  // Generate rooms as a grid flat array for simplicity, Y=0 for now
  const objects = [];
  for (let x = -Math.floor(gridSize / 2); x <= Math.floor(gridSize / 2); x++) {
    for (let z = -Math.floor(gridSize / 2); z <= Math.floor(gridSize / 2); z++) {
      objects.push([x, 0, z]);
    }
  }

  // Spawn enemies randomly in the level
  const enemies = [];
  for (let i = 0; i < maxEnemies; i++) {
    let pos;
    do {
      pos = getRandomPosition();
    } while (
      enemies.some((e) => positionsEqual(e.position, pos)) ||
      (pos[0] === -Math.floor(gridSize / 2) && pos[2] === 0) // avoid spawn at start
    );

    enemies.push({
      position: pos,
      spawnType: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
    });
  }

  // Place keycard(s) randomly inside obstacles (random rooms)
  const keycardPositions = [];
  while (keycardPositions.length < keycardRoomCount) {
    let pos;
    do {
      pos = getRandomPosition();
    } while (
      keycardPositions.some((kp) => positionsEqual(kp, pos)) ||
      enemies.some((e) => positionsEqual(e.position, pos)) ||
      (pos[0] === -Math.floor(gridSize / 2) && pos[2] === 0) // avoid start room
    );
    keycardPositions.push(pos);
  }

  // Locked doors positions
  const lockedDoors = [];
  while (lockedDoors.length < lockedDoorCount) {
    let pos;
    do {
      pos = getRandomPosition();
    } while (
      lockedDoors.some((ld) => positionsEqual(ld, pos)) ||
      enemies.some((e) => positionsEqual(e.position, pos)) ||
      keycardPositions.some((kp) => positionsEqual(kp, pos)) ||
      (pos[0] === -Math.floor(gridSize / 2) && pos[2] === 0) // avoid start room
    );
    lockedDoors.push(pos);
  }

  // Start and target rooms
  const startRoom = [-Math.floor(gridSize / 2), 0, 0];
  const targetRoom = [Math.floor(gridSize / 2), 0, 0];

  return {
    name: levelName,
    description: `Floor 1 - navigate the lab, collect keycard, avoid zombies`,
    objects,
    enemies,
    keycards: keycardPositions.map((pos) => ({ position: pos, item: "keycard" })),
    lockedDoors,
    target: targetRoom,
    metadata: {
      startRoom,
      elevatorAccess: true,
      mapDensity: "medium",
    },
  };
}

const levelData = generateLevel({});
fs.writeFileSync("lab_level_1.json", JSON.stringify(levelData, null, 2));
console.log("Level saved as lab_level_1.json");
