from mcp.server.fastmcp.server import FastMCP, Settings

def create_mcp_server():
    """Create and configure the MCP server with tools"""
    # Create a named server
    mcp = FastMCP("ast-mcp")
    
    # Import and register tools
    from tools.ts_change_signature import register_ts_tools
    from tools.long_task import register_long_task_tools
    
    register_ts_tools(mcp)
    register_long_task_tools(mcp)
    
    return mcp

def main():
    mcp = create_mcp_server()
    mcp.run()

if __name__ == "__main__":
    main()