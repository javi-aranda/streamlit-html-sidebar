function initSidebar(sidebarId, width, content) {
    const parentDoc = window.parent.document;
    let isClosing = false;
    
    function detectStreamlitTheme() {
        // Detect Streamlit's theme
        const stApp = parentDoc.querySelector('.stApp');
        if (!stApp) return 'light';
        
        try {
            const computedStyle = window.parent.getComputedStyle(stApp);
            const backgroundColor = computedStyle.backgroundColor;
            
            // Parse RGB values to determine if it's dark or light
            const rgb = backgroundColor.match(/\d+/g);
            if (rgb) {
                const [r, g, b] = rgb.map(Number);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness < 128 ? 'dark' : 'light';
            }
        } catch (e) {
            console.log('Couldn\'t detect theme: ', e);
        }

        return 'light'; // Default fallback
    }

    function createStyles() {
        if (!parentDoc.getElementById('dynamic-sidebar-styles')) {
            const theme = detectStreamlitTheme();
            const isDark = theme === 'dark';
            
            console.log('Detected Streamlit theme:', theme);
            
            const style = parentDoc.createElement('style');
            style.id = 'dynamic-sidebar-styles';
            style.textContent = `
                :root {
                    --sidebar-width: ${width};
                    --sidebar-bg-color: ${isDark ? '#0e1117' : '#ffffff'};
                    --sidebar-text-color: ${isDark ? '#fafafa' : '#262730'};
                    --sidebar-border-color: ${isDark ? '#262730' : '#e6eaf1'};
                    --sidebar-shadow-color: ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
                    --sidebar-close-btn-color: ${isDark ? '#fafafa' : '#262730'};
                    --sidebar-close-btn-hover-bg: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
                }
            `;
            parentDoc.head.appendChild(style);
            
            // Add CSS
            const link = parentDoc.createElement('link');
            link.id = 'sidebar-css';
            link.rel = 'stylesheet';
            link.href = '${CSS_PATH}';
            parentDoc.head.appendChild(link);
        }
    }

    function adjustSidebarHeight() {
        const sidebar = parentDoc.getElementById(sidebarId);
        if (sidebar) {
            sidebar.style.height = window.parent.innerHeight + "px";
        }
    }
    
    function createSidebar() {
        isClosing = false;
        
        const existingSidebars = parentDoc.querySelectorAll('.sidebar');
        existingSidebars.forEach(sidebar => {
            sidebar.remove();
        });

        const sidebar = parentDoc.createElement('div');
        sidebar.id = sidebarId;
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <span class="close-btn">&#xD7;</span>
            ${content}
        `;

        parentDoc.body.appendChild(sidebar);
        
        sidebar.offsetHeight;
        
        requestAnimationFrame(() => {
            sidebar.classList.add('visible');
        });

        const closeBtn = sidebar.querySelector('.close-btn');
        closeBtn.addEventListener('click', closeSidebar);
        
        adjustSidebarHeight();
    }

    function closeSidebar() {
        if (isClosing) return;
        
        const sidebar = parentDoc.getElementById(sidebarId);
        
        if (sidebar) {
            isClosing = true;
            sidebar.classList.remove('visible');
            
            sidebar.addEventListener('transitionend', () => {
                sidebar.remove();
                isClosing = false;
            }, { once: true });
        }
    }

    createStyles();
    createSidebar();
    
    window.parent.addEventListener('resize', adjustSidebarHeight);
} 