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

      expect(createStylesSpy).toHaveBeenCalled();
      expect(createSidebarSpy).toHaveBeenCalled();

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
      expect(detectStreamlitTheme()).toBe('light');
    });

    test('should detect dark theme correctly', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({}); // Mock stApp existence
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(14, 17, 23)' }); // Dark theme color
      expect(detectStreamlitTheme()).toBe('dark');
    });

    test('should fallback to light theme if stApp is not found', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue(null);
      expect(detectStreamlitTheme()).toBe('light');
    });

    test('should fallback to light theme if getComputedStyle fails', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn(() => { throw new Error('Style error'); });
      expect(detectStreamlitTheme()).toBe('light');
    });
     test('should fallback to light theme if background color is not in rgb format', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'transparent' });
      expect(detectStreamlitTheme()).toBe('light');
    });
  });

  describe('createStyles', () => {
    test('should create style and link elements if they do not exist', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue(null); // Styles do not exist
      global.parent.document.querySelector = jest.fn().mockReturnValue({}); // Mock stApp
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(255, 255, 255)' }); // Light theme

      createStyles('300px', '${CSS_PATH}'); // Assuming CSS_PATH is a placeholder

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

      createStyles('250px', 'path/to/style.css');

      expect(global.parent.document.head.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          textContent: expect.stringContaining('--sidebar-bg-color: #0e1117;')
        })
      );
    });

    test('should not create styles if style tag already exists', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue({}); // Styles exist

      createStyles('300px', 'path/to/style.css');

      expect(global.parent.document.createElement).not.toHaveBeenCalledWith('style');
      expect(global.parent.document.createElement).not.toHaveBeenCalledWith('link');
    });
  });

  describe('createSidebar', () => {
    const sidebarId = 'test-sidebar';
    const content = '<p>Test Content</p>';
    let mockSidebarElement;

    beforeEach(() => {
      // Reset mock for sidebar element before each test in this suite
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
      createSidebar(sidebarId, content);

      expect(global.parent.document.createElement).toHaveBeenCalledWith('div');
      expect(mockSidebarElement.id).toBe(sidebarId);
      expect(mockSidebarElement.className).toBe('sidebar');
      expect(mockSidebarElement.innerHTML).toContain(content);
      expect(mockSidebarElement.innerHTML).toContain('<span class="close-btn">&#xD7;</span>');
      expect(global.parent.document.body.appendChild).toHaveBeenCalledWith(mockSidebarElement);
    });

    test('should make sidebar visible using requestAnimationFrame', () => {
      createSidebar(sidebarId, content);
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(mockSidebarElement.classList.add).toHaveBeenCalledWith('visible');
    });

    test('should add event listener to close button', () => {
      createSidebar(sidebarId, content);
      const closeBtnMock = mockSidebarElement.querySelector('.close-btn');
      expect(closeBtnMock.addEventListener).toHaveBeenCalledWith('click', closeSidebar);
    });

    test('should call adjustSidebarHeight', () => {
        // Spy on adjustSidebarHeight as it's part of the same module
        const sidebarModule = require('./sidebar');
        const adjustSidebarHeightSpy = jest.spyOn(sidebarModule, 'adjustSidebarHeight');
        
        createSidebar(sidebarId, content);
        
        expect(adjustSidebarHeightSpy).toHaveBeenCalled();
        
        // Clean up spy
        adjustSidebarHeightSpy.mockRestore();
    });

    test('should remove existing sidebars before creating a new one', () => {
      const mockExistingSidebar = { remove: jest.fn() };
      global.parent.document.querySelectorAll = jest.fn(() => [mockExistingSidebar, mockExistingSidebar]);
      
      createSidebar(sidebarId, content);
      
      expect(global.parent.document.querySelectorAll).toHaveBeenCalledWith('.sidebar');
      expect(mockExistingSidebar.remove).toHaveBeenCalledTimes(2);
    });
  });

  describe('closeSidebar', () => {
    const sidebarId = 'test-sidebar';
    let mockSidebarElement;

    beforeEach(() => {
      mockSidebarElement = {
        id: sidebarId,
        classList: { remove: jest.fn() },
        addEventListener: jest.fn((event, cb) => {
          // Immediately invoke callback for 'transitionend' for testing
          if (event === 'transitionend') {
            cb();
          }
        }),
        remove: jest.fn(),
      };
      global.parent.document.getElementById = jest.fn(() => mockSidebarElement);
    });

    test('should remove "visible" class and sidebar element after transition', () => {
      closeSidebar(sidebarId);

      expect(global.parent.document.getElementById).toHaveBeenCalledWith(sidebarId);
      expect(mockSidebarElement.classList.remove).toHaveBeenCalledWith('visible');
      expect(mockSidebarElement.addEventListener).toHaveBeenCalledWith('transitionend', expect.any(Function), { once: true });
      // Callback for transitionend should have been called, leading to remove()
      expect(mockSidebarElement.remove).toHaveBeenCalled();
    });

    test('should not do anything if sidebar is not found', () => {
      global.parent.document.getElementById = jest.fn(() => null); // Sidebar not found
      closeSidebar(sidebarId);

      expect(mockSidebarElement.classList.remove).not.toHaveBeenCalled();
      expect(mockSidebarElement.remove).not.toHaveBeenCalled();
    });
    
    test('should not run if already closing', () => {
      // Call once to set isClosing to true internally (via the transitionend mock)
      closeSidebar(sidebarId);
      
      // Reset mocks for the actual test part
      mockSidebarElement.classList.remove.mockClear();
      mockSidebarElement.addEventListener.mockClear();
      mockSidebarElement.remove.mockClear();
      global.parent.document.getElementById.mockClear();

      // At this point, isClosing should be true within the closeSidebar's closure scope
      // from the previous call. However, this is hard to test directly without exposing isClosing.
      // The current implementation of closeSidebar has a bug: isClosing is not shared across calls
      // if initSidebar is not re-run. For this test, we assume a fresh context or that
      // the isClosing flag is correctly managed by its surrounding scope (initSidebar).
      // Given the current structure, a direct test for the isClosing flag's effect
      // without calling initSidebar is tricky.
      // This test will effectively test the "not found" path again if isClosing isn't working as expected
      // across independent calls to closeSidebar.
      // A better way would be to have isClosing as part of an object or returned/managed by initSidebar.

      // Simulate isClosing being true by having getElementById return null
      // This isn't a perfect test of the flag, but of the function's behavior
      // if it were to try and close an already-in-process-of-closing sidebar.
      // A more direct test would require refactoring sidebar.js.
      
      // To properly test the isClosing flag, we'd need to call closeSidebar twice quickly.
      // The first call sets isClosing = true. The second call should then immediately return.
      // However, our mock for addEventListener calls the callback immediately.
      
      const realSidebarModule = require('./sidebar');
      // We need to re-initialize a sidebar to have a fresh `isClosing` variable in its scope.
      // This is a limitation of testing module-scoped booleans like this.
      // For this test, we'll assume `initSidebar` sets up the environment where `closeSidebar` operates.
      
      // Let's simulate the scenario where closeSidebar is called twice.
      const localMockSidebarElement = {
        id: 'local-test-sidebar',
        classList: { remove: jest.fn() },
        addEventListener: jest.fn(), // Don't auto-trigger transitionend here
        remove: jest.fn(),
      };
      global.parent.document.getElementById = jest.fn(() => localMockSidebarElement);

      // Call 1 - starts closing
      realSidebarModule.closeSidebar('local-test-sidebar'); 
      expect(localMockSidebarElement.classList.remove).toHaveBeenCalledTimes(1);
      expect(localMockSidebarElement.addEventListener).toHaveBeenCalledTimes(1);
      
      // Call 2 - should do nothing because isClosing is true (within that scope)
      realSidebarModule.closeSidebar('local-test-sidebar');
      expect(localMockSidebarElement.classList.remove).toHaveBeenCalledTimes(1); // No new calls
      expect(localMockSidebarElement.addEventListener).toHaveBeenCalledTimes(1); // No new calls
    });
  });

  describe('adjustSidebarHeight', () => {
    const sidebarId = 'test-sidebar';

    test('should set sidebar height to window.parent.innerHeight', () => {
      const mockSidebar = { style: {} };
      global.parent.document.getElementById = jest.fn(() => mockSidebar);
      global.parent.innerHeight = 800; // Example height

      adjustSidebarHeight(sidebarId);

      expect(global.parent.document.getElementById).toHaveBeenCalledWith(sidebarId);
      expect(mockSidebar.style.height).toBe('800px');
    });

    test('should not throw error if sidebar is not found', () => {
      global.parent.document.getElementById = jest.fn(() => null); // Sidebar not found
      
      expect(() => adjustSidebarHeight(sidebarId)).not.toThrow();
    });
  });
});
