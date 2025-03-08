[![PyPI version](https://badge.fury.io/py/streamlit-html-sidebar.svg)](https://badge.fury.io/py/streamlit-html-sidebar)
[![codecov](https://codecov.io/gh/javi-aranda/streamlit-html-sidebar/branch/master/graph/badge.svg)](https://codecov.io/gh/javi-aranda/streamlit-html-sidebar)


# Streamlit HTML Sidebar

A Streamlit component that allows you to create a customizable HTML sidebar that slides in from the right side of the screen.

![Streamlit HTML Sidebar](https://github.com/javi-aranda/streamlit-html-sidebar/blob/master/examples/example.png?raw=true)

## Features

- Create a sidebar with custom HTML content
- Customize the width of the sidebar

## Installation

```bash
pip install streamlit-html-sidebar
```

## Usage

```python
import streamlit as st
from streamlit_html_sidebar import create_sidebar

st.title("Streamlit HTML Sidebar Example")

# Create a button to open the sidebar
if st.button("Open Sidebar"):
    # Create a sidebar with custom HTML content
    content = """
    <div style="padding: 20px;">
        <h2>Custom Sidebar</h2>
        <p>This is a custom sidebar created with streamlit-html-sidebar.</p>
    </div>
    """
    create_sidebar(content, width="400px")
```
