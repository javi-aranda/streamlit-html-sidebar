import streamlit as st
from streamlit_html_sidebar import create_sidebar

st.title("Streamlit HTML Sidebar Example")


if st.button("Open Sidebar"):
    
    html_content = """
    <div style="padding: 20px;">
        <h2>Custom Sidebar</h2>
        <p>This is a custom sidebar created with streamlit-html-sidebar.</p>
        <hr>
        <p>Made with ❤️ by <a href="https://github.com/javi-aranda" target="_blank">Javi Aranda</a></p>
        <hr>
    </div>
    """
    
    create_sidebar(html_content, width="400px")

st.markdown("""
## Instructions

1. Click the "Open Sidebar" button to open the sidebar.
2. Sidebar will appear from the right side of the screen.
3. Click the "×" button in the top-left corner of the sidebar to close it.

## Code Example

```python
import streamlit as st
from streamlit_html_sidebar import create_sidebar

# Create a sidebar with custom CSS
if st.button("Open Sidebar"):
    
    create_sidebar("<h1>Hello World</h1>")
```
""") 