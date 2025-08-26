"use client";

import React, { useEffect, useRef, useState } from "react";

export default function SnakeGame() {
  const tileCount = 20;
  const boxSize = 20;
  const canvasSize = tileCount * boxSize;

  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const logoLoadedRef = useRef(false);

  // mutable refs for game state (avoids stale closure issues)
  const snakeRef = useRef([{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }]);
  const dirRef = useRef({ x: 1, y: 0 }); // start moving right
  const foodRef = useRef(null);
  const scoreRef = useRef(0);
  const runningRef = useRef(true);
  const intervalRef = useRef(null);

  // React state for UI
  const [score, setScore] = useState(0);

  // spawn food not on the snake
  function spawnFood() {
    const snake = snakeRef.current;
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * tileCount);
      y = Math.floor(Math.random() * tileCount);
      tries++;
      // safety break in case grid full
      if (tries > 500) break;
    } while (snake.some((s) => s.x === x && s.y === y));
    return { x, y };
  }

  useEffect(() => {
    // load logo
    logoRef.current = new Image();
    logoRef.current.src = "/intuition-logo.png"; // put your image in /public
    logoRef.current.onload = () => {
      logoLoadedRef.current = true;
      // initial draw once loaded
      draw();
    };

    // initial food
    if (!foodRef.current) foodRef.current = spawnFood();

    // key handling
    function handleKey(e) {
      const d = dirRef.current;
      if (e.key === "ArrowUp" && d.y !== 1) dirRef.current = { x: 0, y: -1 };
      if (e.key === "ArrowDown" && d.y !== -1) dirRef.current = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" && d.x !== 1) dirRef.current = { x: -1, y: 0 };
      if (e.key === "ArrowRight" && d.x !== -1) dirRef.current = { x: 1, y: 0 };
    }
    window.addEventListener("keydown", handleKey);

    // game tick
    function tick() {
      if (!runningRef.current) return;

      const snake = snakeRef.current;
      const dir = dirRef.current;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // wall collision
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
      }

      // self collision
      for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
          gameOver();
          return;
        }
      }

      // move
      snake.unshift(head);

      // eat food?
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        // spawn new food not on snake
        foodRef.current = spawnFood();
      } else {
        snake.pop(); // only pop if not eating -> growth occurs when eating
      }

      // draw current state
      draw();
    }

    // draw function
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      // background
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // draw snake
      snakeRef.current.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? "#4cafef" : "#33ff77";
        ctx.fillRect(seg.x * boxSize, seg.y * boxSize, boxSize - 1, boxSize - 1);
      });

      // draw food (logo if loaded, else red square)
      const food = foodRef.current;
      if (!food) return;
      if (logoLoadedRef.current && logoRef.current) {
        ctx.drawImage(logoRef.current, food.x * boxSize, food.y * boxSize, boxSize, boxSize);
      } else {
        ctx.fillStyle = "red";
        ctx.fillRect(food.x * boxSize, food.y * boxSize, boxSize - 1, boxSize - 1);
      }

      // HUD (score)
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText(`Score: ${scoreRef.current}`, 8, 16);
    }

    // start game loop
    runningRef.current = true;
    intervalRef.current = setInterval(tick, 120);

    // cleanup
    return () => {
      runningRef.current = false;
      clearInterval(intervalRef.current);
      window.removeEventListener("keydown", handleKey);
    };
    // we intentionally run this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function gameOver() {
    runningRef.current = false;
    clearInterval(intervalRef.current);
    // show alert
    alert("Game Over! Final Score: " + scoreRef.current);
    // keep final state visible; if you want to auto-reset uncomment below:
    // resetGame();
  }

  function resetGame() {
    snakeRef.current = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
    dirRef.current = { x: 1, y: 0 };
    foodRef.current = spawnFood();
    scoreRef.current = 0;
    setScore(0);
    runningRef.current = true;
    intervalRef.current = setInterval(() => {
      /* tick function is defined in useEffect; easiest is to reload page or add tick ref */ 
      // reload page fallback:
      window.location.reload();
    }, 120);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-3">🐍 Intuition Snake</h1>
      <div className="mb-2">Score: {score}</div>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border border-gray-700 bg-gray-900"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="mt-3 space-x-2">
        <button
          onClick={() => {
            if (!runningRef.current) {
              // simply reload to restart cleanly
              window.location.reload();
            }
          }}
          className="px-3 py-1 rounded bg-blue-600"
        >
          Restart
        </button>
        <button
          onClick={() => {
            // toggle pause
            if (runningRef.current) {
              runningRef.current = false;
              clearInterval(intervalRef.current);
            } else {
              runningRef.current = true;
              intervalRef.current = setInterval(() => {
                // we can't reference tick here (closed over), so reload to restart loop safely
                window.location.reload();
              }, 120);
            }
          }}
          className="px-3 py-1 rounded bg-gray-600"
        >
          {runningRef.current ? "Pause" : "Resume"}
        </button>
      </div>
      <p className="text-xs opacity-80 mt-2">Use arrow keys to move. Eat the logo to grow.</p>
    </div>
  );
}
