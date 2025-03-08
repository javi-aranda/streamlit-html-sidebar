import os
import uuid
from typing import Optional
import streamlit.components.v1 as components
import pkg_resources

STATIC_DIR = pkg_resources.resource_filename("streamlit_html_sidebar", "static")
CSS_PATH = os.path.join(STATIC_DIR, "sidebar.css")
JS_PATH = os.path.join(STATIC_DIR, "sidebar.js")

def create_sidebar(
    content: str,
    width: str = "400px",
    sidebar_id: Optional[str] = None,
    height: int = 0,
) -> None:
    """
    Creates a sidebar with customizable HTML content.
    
    Parameters
    ----------
    content : str
        HTML content to display in the sidebar.
    width : str, optional
        Width of the sidebar, by default "400px".
    sidebar_id : str, optional
        Custom ID for the sidebar. If not provided, a random UUID will be generated.
    height : int, optional
        Height of the component iframe, by default 0.
        
    Returns
    -------
    None
        This function doesn't return any value but renders the sidebar component.
        
    Examples
    --------
    >>> import streamlit as st
    >>> from streamlit_html_sidebar import create_sidebar
    >>> 
    >>> # Create a button to open the sidebar
    >>> if st.button("Open Sidebar"):
    >>>     create_sidebar("<h1>Hello World</h1><p>This is a custom sidebar!</p>")
    """
    # Generate a unique ID if not provided
    if sidebar_id is None:
        sidebar_id = f"sidebar-{str(uuid.uuid4())}"
    
    # Read the CSS and JS files
    with open(CSS_PATH, "r") as f:
        css_content = f.read()
    
    with open(JS_PATH, "r") as f:
        js_content = f.read()
    
    # Encode the CSS content for JavaScript
    css_content_escaped = css_content.replace('\n', '\\n').replace('"', '\\"').replace("'", "\\'")

    # Replace the CSS_PATH placeholder in the JS file
    js_content = js_content.replace("${CSS_PATH}", f"data:text/css,{css_content_escaped}")
    
    html_code = f"""
        <script id="{sidebar_id}" charset="UTF-8">
            {js_content}
            (function() {{
                initSidebar("{sidebar_id}", "{width}", `{content}`);
            }})();
        </script>
    """
    
    return components.html(html_code, height=height)
