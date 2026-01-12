#!/usr/bin/env bun
import { program } from "commander";
import { detectTerminal, spawnCanvas } from "./terminal";

// Set window title via ANSI escape codes
function setWindowTitle(title: string) {
  process.stdout.write(`\x1b]0;${title}\x07`);
}

program
  .name("claude-canvas")
  .description("Interactive terminal canvases for Claude")
  .version("1.0.0");

program
  .command("show [kind]")
  .description("Show a canvas in the current terminal")
  .option("--id <id>", "Canvas ID")
  .option("--config <json>", "Canvas configuration (JSON)")
  .option("--socket <path>", "Unix socket path for IPC")
  .option("--scenario <name>", "Scenario name (e.g., display, meeting-picker)")
  .action(async (kind = "demo", options) => {
    const id = options.id || `${kind}-1`;
    const config = options.config ? JSON.parse(options.config) : undefined;
    const socketPath = options.socket;
    const scenario = options.scenario || "display";

    // Set window title
    setWindowTitle(`canvas: ${kind}`);

    // Dynamically import and render the canvas
    const { renderCanvas } = await import("./canvases");
    await renderCanvas(kind, id, config, { socketPath, scenario });
  });

program
  .command("spawn [kind]")
  .description("Spawn a canvas in a new terminal window")
  .option("--id <id>", "Canvas ID")
  .option("--config <json>", "Canvas configuration (JSON)")
  .option("--socket <path>", "Unix socket path for IPC")
  .option("--scenario <name>", "Scenario name (e.g., display, meeting-picker)")
  .action(async (kind = "demo", options) => {
    const id = options.id || `${kind}-1`;
    const result = await spawnCanvas(kind, id, options.config, {
      socketPath: options.socket,
      scenario: options.scenario,
    });
    console.log(`Spawned ${kind} canvas '${id}' via ${result.method}`);
  });

program
  .command("env")
  .description("Show detected terminal environment")
  .action(() => {
    const env = detectTerminal();
    console.log("Terminal Environment:");
    console.log(`  In tmux: ${env.inTmux}`);
    console.log(`\nSummary: ${env.summary}`);
  });

program
  .command("update <id>")
  .description("Send updated config to a running canvas via IPC")
  .option("--config <json>", "New canvas configuration (JSON)")
  .action(async (id: string, options) => {
    const { getSocketPath } = await import("./ipc/types");
    const socketPath = getSocketPath(id);
    const config = options.config ? JSON.parse(options.config) : {};

    try {
      const socket = await Bun.connect({
        unix: socketPath,
        socket: {
          data(socket, data) {
            // Ignore responses
          },
          open(socket) {
            const msg = JSON.stringify({ type: "update", config });
            socket.write(msg + "\n");
            socket.end();
          },
          close() {},
          error(socket, error) {
            console.error("Socket error:", error);
          },
        },
      });
      console.log(`Sent update to canvas '${id}'`);
    } catch (err) {
      console.error(`Failed to connect to canvas '${id}':`, err);
    }
  });

program
  .command("selection <id>")
  .description("Get the current selection from a running document canvas")
  .action(async (id: string) => {
    const { getSocketPath } = await import("./ipc/types");
    const socketPath = getSocketPath(id);

    try {
      let resolved = false;
      const result = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error("Timeout waiting for response"));
          }
        }, 2000);

        Bun.connect({
          unix: socketPath,
          socket: {
            data(socket, data) {
              if (resolved) return;
              clearTimeout(timeout);
              resolved = true;
              const response = JSON.parse(data.toString().trim());
              if (response.type === "selection") {
                resolve(JSON.stringify(response.data));
              } else {
                resolve(JSON.stringify(null));
              }
              socket.end();
            },
            open(socket) {
              const msg = JSON.stringify({ type: "getSelection" });
              socket.write(msg + "\n");
            },
            close() {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(JSON.stringify(null));
              }
            },
            error(socket, error) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                reject(error);
              }
            },
          },
        });
      });
      console.log(result);
    } catch (err) {
      console.error(`Failed to get selection from canvas '${id}':`, err);
      process.exit(1);
    }
  });

program
  .command("content <id>")
  .description("Get the current content from a running document canvas")
  .action(async (id: string) => {
    const { getSocketPath } = await import("./ipc/types");
    const socketPath = getSocketPath(id);

    try {
      let resolved = false;
      const result = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error("Timeout waiting for response"));
          }
        }, 2000);

        Bun.connect({
          unix: socketPath,
          socket: {
            data(socket, data) {
              if (resolved) return;
              clearTimeout(timeout);
              resolved = true;
              const response = JSON.parse(data.toString().trim());
              if (response.type === "content") {
                resolve(JSON.stringify(response.data));
              } else {
                resolve(JSON.stringify(null));
              }
              socket.end();
            },
            open(socket) {
              const msg = JSON.stringify({ type: "getContent" });
              socket.write(msg + "\n");
            },
            close() {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(JSON.stringify(null));
              }
            },
            error(socket, error) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                reject(error);
              }
            },
          },
        });
      });
      console.log(result);
    } catch (err) {
      console.error(`Failed to get content from canvas '${id}':`, err);
      process.exit(1);
    }
  });

program
  .command("render <component>")
  .description("Render a component to an image file")
  .option("--output <path>", "Output file path (png or svg)", "output.png")
  .option("--width <number>", "Image width in pixels", "800")
  .option("--height <number>", "Image height in pixels", "600")
  .option("--title <text>", "Title text for card component")
  .option("--description <text>", "Description text for card component")
  .option("--text <text>", "Text content for badge component")
  .option("--variant <name>", "Component variant (default, dark, light, success, etc.)")
  .option("--props <json>", "Additional props as JSON")
  .action(async (component: string, options) => {
    const React = await import("react");
    const { renderToFile, Card, CardContent, CardRow, Badge, BadgeGroup } = await import("./image");

    const width = parseInt(options.width, 10);
    const height = parseInt(options.height, 10);
    const format = options.output.endsWith(".svg") ? "svg" : "png";
    const extraProps = options.props ? JSON.parse(options.props) : {};

    let element: React.ReactElement;

    switch (component) {
      case "card":
        element = React.createElement(Card, {
          title: options.title || "Card Title",
          description: options.description,
          variant: options.variant || "default",
          ...extraProps,
        }, extraProps.rows ? React.createElement(
          CardContent,
          null,
          ...extraProps.rows.map((row: { label: string; value: string }, i: number) =>
            React.createElement(CardRow, { key: i, label: row.label, value: row.value, variant: options.variant })
          )
        ) : null);
        break;

      case "badge":
        element = React.createElement(Badge, {
          variant: options.variant || "default",
          children: options.text || "Badge",
          ...extraProps,
        });
        break;

      case "badges":
        const badges = extraProps.badges || [
          { text: "Success", variant: "success" },
          { text: "Warning", variant: "warning" },
          { text: "Error", variant: "error" },
        ];
        element = React.createElement(
          "div",
          { style: { display: "flex", padding: 24, background: "#1a1a1a", gap: 8 } },
          React.createElement(
            BadgeGroup,
            null,
            ...badges.map((b: { text: string; variant: string }, i: number) =>
              React.createElement(Badge, { key: i, variant: b.variant as any, children: b.text })
            )
          )
        );
        break;

      default:
        console.error(`Unknown component: ${component}`);
        console.log("Available components: card, badge, badges");
        process.exit(1);
    }

    await renderToFile(element, options.output, { width, height, format });
    console.log(`Rendered ${component} to ${options.output} (${width}x${height} ${format})`);
  });

program.parse();
