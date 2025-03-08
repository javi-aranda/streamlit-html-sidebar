import os
import unittest
from unittest.mock import patch
from streamlit_html_sidebar.sidebar import create_sidebar


class TestSidebar(unittest.TestCase):
    
    @patch('streamlit.components.v1.html')
    def test_create_sidebar_default_params(self, mock_html):
        mock_html.return_value = None
        
        create_sidebar("<p>Test content</p>")
        
        mock_html.assert_called_once()
        
        args, kwargs = mock_html.call_args
        
        self.assertIn("<p>Test content</p>", args[0])
        
        self.assertEqual(kwargs['height'], 0)
    
    @patch('streamlit.components.v1.html')
    def test_create_sidebar_custom_params(self, mock_html):
        mock_html.return_value = None
        
        create_sidebar(
            content="<p>Custom content</p>",
            width="500px",
            sidebar_id="custom-id",
            height=100
        )
        
        mock_html.assert_called_once()
        
        args, kwargs = mock_html.call_args
        
        self.assertIn("<p>Custom content</p>", args[0])
        
        self.assertIn("500px", args[0])
        self.assertIn("custom-id", args[0])
        self.assertEqual(kwargs['height'], 100)
    
    def test_static_files_exist(self):
        from streamlit_html_sidebar.sidebar import CSS_PATH, JS_PATH
        
        self.assertTrue(os.path.exists(CSS_PATH), f"CSS file not found: {CSS_PATH}")
        self.assertTrue(os.path.exists(JS_PATH), f"JS file not found: {JS_PATH}")


if __name__ == '__main__':
    unittest.main() 