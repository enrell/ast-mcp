from mcp.server.fastmcp.server import FastMCP, Settings

# settings = Settings()

# Create a named server
mcp = FastMCP("ast-mcp")

def main():
    mcp.run()

if __name__ == "__main__":
    main()