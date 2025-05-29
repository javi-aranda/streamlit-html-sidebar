// Mock parent document and window
global.parent = {
  document: {
    head: {
      appendChild: jest.fn(),
    },
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(), // if sidebar.remove() is directly on body child
    },
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []), // Default to no existing sidebars
    createElement: jest.fn(tagName => ({
      tagName,
      id: '',
      className: '',
      innerHTML: '',
      style: {},
      href: '',
      rel: '',
      textContent: '',
      appendChild: jest.fn(),
      remove: jest.fn(), // Mock the .remove() method for elements
      addEventListener: jest.fn(),
      offsetHeight: 0, // Mock offsetHeight
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
      },
      querySelector: jest.fn(selector => { // Mock querySelector on created elements
        if (selector === '.close-btn') {
          return { addEventListener: jest.fn() };
        }
        return null;
      }),
    })),
  },
  getComputedStyle: jest.fn(() => ({ backgroundColor: 'rgb(255, 255, 255)' })), // Default to light theme
  innerHeight: 768, // Mock initial window height
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => cb());

// Import the function to be tested after mocks are set up
const { initSidebar, detectStreamlitTheme, createStyles, createSidebar, closeSidebar, adjustSidebarHeight } = require('./sidebar');

describe('Sidebar Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset querySelectorAll to default (no existing sidebars)
    global.parent.document.querySelectorAll = jest.fn(() => []);
    // Reset getElementById to default (not found)
    global.parent.document.getElementById = jest.fn(() => null);
     // Reset querySelector to default (not found)
    global.parent.document.querySelector = jest.fn(() => null);
    // Reset getComputedStyle to default (light theme)
    global.parent.getComputedStyle = jest.fn(() => ({ backgroundColor: 'rgb(255, 255, 255)' }));
  });

  describe('initSidebar', () => {
    const sidebarId = 'test-sidebar';
    const width = '300px';
    const content = '<p>Test Content</p>';

    test('should call createStyles and createSidebar', () => {
      // To properly test initSidebar, we need to mock the functions it calls internally
      // that are also part of the module. We can spy on them.
      const sidebarModule = require('./sidebar');
      const createStylesSpy = jest.spyOn(sidebarModule, 'createStyles');
      const createSidebarSpy = jest.spyOn(sidebarModule, 'createSidebar');
      
      // Mock getElementById for createStyles and createSidebar internal calls
      global.parent.document.getElementById = jest.fn(id => {
        if (id === 'dynamic-sidebar-styles') return null; // Simulate styles not existing yet
        if (id === sidebarId) return null; // Simulate sidebar not existing yet
        return {
          id,
          style: {},
          remove: jest.fn(),
          addEventListener: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          querySelector: jest.fn(() => ({ addEventListener: jest.fn() })),
        };
      });
      
      sidebarModule.initSidebar(sidebarId, width, content);

      expect(createStylesSpy).toHaveBeenCalledWith(global.parent.document, width);
      expect(createSidebarSpy).toHaveBeenCalledWith(global.parent.document, sidebarId, content, expect.any(Function));

      // Clean up spies
      createStylesSpy.mockRestore();
      createSidebarSpy.mockRestore();
    });

    test('should add resize event listener to window.parent', () => {
      initSidebar(sidebarId, width, content);
      expect(global.parent.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('detectStreamlitTheme', () => {
    test('should detect light theme correctly', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({}); // Mock stApp existence
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(255, 255, 255)' });
      expect(detectStreamlitTheme(global.parent.document)).toBe('light');
    });

    test('should detect dark theme correctly', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({}); // Mock stApp existence
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(14, 17, 23)' }); // Dark theme color
      expect(detectStreamlitTheme(global.parent.document)).toBe('dark');
    });

    test('should fallback to light theme if stApp is not found', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue(null);
      expect(detectStreamlitTheme(global.parent.document)).toBe('light');
    });

    test('should fallback to light theme if getComputedStyle fails', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn(() => { throw new Error('Style error'); });
      expect(detectStreamlitTheme(global.parent.document)).toBe('light');
    });
     test('should fallback to light theme if background color is not in rgb format', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'transparent' });
      expect(detectStreamlitTheme(global.parent.document)).toBe('light');
    });
  });

  describe('createStyles', () => {
    test('should create style and link elements if they do not exist', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue(null); // Styles do not exist
      global.parent.document.querySelector = jest.fn().mockReturnValue({}); // Mock stApp
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(255, 255, 255)' }); // Light theme

      createStyles(global.parent.document, '300px');

      // Check for <style> tag creation
      expect(global.parent.document.createElement).toHaveBeenCalledWith('style');
      expect(global.parent.document.head.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dynamic-sidebar-styles',
          textContent: expect.stringContaining('--sidebar-width: 300px;')
        })
      );

      // Check for <link> tag creation
      expect(global.parent.document.createElement).toHaveBeenCalledWith('link');
      expect(global.parent.document.head.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sidebar-css',
          rel: 'stylesheet',
          href: '${CSS_PATH}'
        })
      );
    });

    test('should use dark theme variables if dark theme is detected', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue(null);
      global.parent.document.querySelector = jest.fn().mockReturnValue({}); // Mock stApp
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(14, 17, 23)' }); // Dark theme

      createStyles(global.parent.document, '250px');

      expect(global.parent.document.head.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          textContent: expect.stringContaining('--sidebar-bg-color: #0e1117;')
        })
      );
    });

    test('should not create styles if style tag already exists', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue({}); // Styles exist

      createStyles(global.parent.document, '300px');

      expect(global.parent.document.createElement).not.toHaveBeenCalledWith('style');
      expect(global.parent.document.createElement).not.toHaveBeenCalledWith('link');
    });
  });

  describe('createSidebar', () => {
    const sidebarId = 'test-sidebar';
    const content = '<p>Test Content</p>';
    let mockSidebarElement;
    let mockCloseCallback;

    beforeEach(() => {
      mockCloseCallback = jest.fn();
      mockSidebarElement = {
        id: sidebarId,
        className: 'sidebar',
        innerHTML: '',
        style: {},
        offsetHeight: 100, // Mock offsetHeight
        classList: { add: jest.fn(), remove: jest.fn() },
        querySelector: jest.fn(),
        addEventListener: jest.fn(),
        remove: jest.fn(),
      };
      global.parent.document.createElement = jest.fn(() => mockSidebarElement);
      global.parent.document.getElementById = jest.fn(() => mockSidebarElement); // For adjustSidebarHeight
      
      // Mock querySelector for the close button
      const mockCloseButton = { addEventListener: jest.fn() };
      mockSidebarElement.querySelector = jest.fn(selector => {
        if (selector === '.close-btn') return mockCloseButton;
        return null;
      });
    });

    test('should create sidebar element with correct properties', () => {
      createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);

      expect(global.parent.document.createElement).toHaveBeenCalledWith('div');
      expect(mockSidebarElement.id).toBe(sidebarId);
      expect(mockSidebarElement.className).toBe('sidebar');
      expect(mockSidebarElement.innerHTML).toContain(content);
      expect(mockSidebarElement.innerHTML).toContain('<span class="close-btn">&#xD7;</span>');
      expect(global.parent.document.body.appendChild).toHaveBeenCalledWith(mockSidebarElement);
    });

    test('should make sidebar visible using requestAnimationFrame', () => {
      createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(mockSidebarElement.classList.add).toHaveBeenCalledWith('visible');
    });

    test('should add event listener to close button', () => {
      createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
      const closeBtnMock = mockSidebarElement.querySelector('.close-btn');
      expect(closeBtnMock.addEventListener).toHaveBeenCalledWith('click', mockCloseCallback);
    });

    test('should call adjustSidebarHeight', () => {
        // Spy on adjustSidebarHeight as it's part of the same module
        const sidebarModule = require('./sidebar');
        const adjustSidebarHeightSpy = jest.spyOn(sidebarModule, 'adjustSidebarHeight');
        
        createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
        
        expect(adjustSidebarHeightSpy).toHaveBeenCalled();
        
        // Clean up spy
        adjustSidebarHeightSpy.mockRestore();
    });

    test('should remove existing sidebars before creating a new one', () => {
      const mockExistingSidebar = { remove: jest.fn() };
      global.parent.document.querySelectorAll = jest.fn(() => [mockExistingSidebar, mockExistingSidebar]);
      
      createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
      
      expect(global.parent.document.querySelectorAll).toHaveBeenCalledWith('.sidebar');
      expect(mockExistingSidebar.remove).toHaveBeenCalledTimes(2);
    });
  });

  describe('closeSidebar', () => {
    const sidebarId = 'test-sidebar';
    let mockSidebarElement;
    let isClosingRef;

    beforeEach(() => {
      isClosingRef = { value: false };
      mockSidebarElement = {
        id: sidebarId,
        classList: { remove: jest.fn() },
        addEventListener: jest.fn((event, cb) => {
          if (event === 'transitionend') {
            cb();
          }
        }),
        remove: jest.fn(),
      };
      global.parent.document.getElementById = jest.fn(() => mockSidebarElement);
    });

    test('should remove "visible" class and sidebar element after transition', () => {
      closeSidebar(global.parent.document, sidebarId, isClosingRef);

      expect(global.parent.document.getElementById).toHaveBeenCalledWith(sidebarId);
      expect(mockSidebarElement.classList.remove).toHaveBeenCalledWith('visible');
      expect(mockSidebarElement.addEventListener).toHaveBeenCalledWith('transitionend', expect.any(Function), { once: true });
      expect(mockSidebarElement.remove).toHaveBeenCalled();
      expect(isClosingRef.value).toBe(false);
    });

    test('should not do anything if sidebar is not found', () => {
      global.parent.document.getElementById = jest.fn(() => null); // Sidebar not found
      closeSidebar(global.parent.document, sidebarId, isClosingRef);

      expect(mockSidebarElement.classList.remove).not.toHaveBeenCalled();
      expect(mockSidebarElement.remove).not.toHaveBeenCalled();
    });
    
    test('should not run if already closing', () => {
      isClosingRef.value = true;
      closeSidebar(global.parent.document, sidebarId, isClosingRef);
      
      expect(global.parent.document.getElementById).not.toHaveBeenCalled();
    });
  });

  describe('adjustSidebarHeight', () => {
    const sidebarId = 'test-sidebar';
    let mockSidebarElement;

    beforeEach(() => {
      mockSidebarElement = {
        style: {},
      };
      global.parent.document.getElementById = jest.fn(() => mockSidebarElement);
    });

    test('should set sidebar height to window height', () => {
      adjustSidebarHeight(global.parent.document, sidebarId);
      
      expect(global.parent.document.getElementById).toHaveBeenCalledWith(sidebarId);
      expect(mockSidebarElement.style.height).toBe('768px');
    });

    test('should not do anything if sidebar is not found', () => {
      global.parent.document.getElementById = jest.fn(() => null); // Sidebar not found
      
      adjustSidebarHeight(global.parent.document, sidebarId);
      
      expect(mockSidebarElement.style.height).toBeUndefined();
    });
  });
});
