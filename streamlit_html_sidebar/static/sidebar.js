function detectStreamlitTheme(parentDoc) {
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

    return 'light'; // Default
}

function createStyles(parentDoc, width) {
    if (!parentDoc.getElementById('dynamic-sidebar-styles')) {
        const theme = detectStreamlitTheme(parentDoc);
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
        
        const link = parentDoc.createElement('link');
        link.id = 'sidebar-css';
        link.rel = 'stylesheet';
        link.href = '${CSS_PATH}';
        parentDoc.head.appendChild(link);
    }
}

function adjustSidebarHeight(parentDoc, sidebarId) {
    const sidebar = parentDoc.getElementById(sidebarId);
    if (sidebar) {
        sidebar.style.height = window.parent.innerHeight + "px";
    }
}

function createSidebar(parentDoc, sidebarId, content, closeSidebarCallback) {
    // Close all existing sidebars before creating a new one
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
    closeBtn.addEventListener('click', closeSidebarCallback);
    
    adjustSidebarHeight(parentDoc, sidebarId);
}

function closeSidebar(parentDoc, sidebarId, isClosingRef) {
    if (isClosingRef.value) return;
    
    const sidebar = parentDoc.getElementById(sidebarId);
    
    if (sidebar) {
        isClosingRef.value = true;
        sidebar.classList.remove('visible');
        
        sidebar.addEventListener('transitionend', () => {
            sidebar.remove();
            isClosingRef.value = false;
        }, { once: true });
    }
}

function initSidebar(sidebarId, width, content) {
    const parentDoc = window.parent.document;
    let isClosingRef = { value: false };
    
    const closeSidebarHandler = () => closeSidebar(parentDoc, sidebarId, isClosingRef);
    
    createStyles(parentDoc, width);
    createSidebar(parentDoc, sidebarId, content, closeSidebarHandler);
    
    const resizeHandler = () => adjustSidebarHeight(parentDoc, sidebarId);
    window.parent.addEventListener('resize', resizeHandler);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSidebar,
        detectStreamlitTheme,
        createStyles,
        createSidebar,
        closeSidebar,
        adjustSidebarHeight
    };
}