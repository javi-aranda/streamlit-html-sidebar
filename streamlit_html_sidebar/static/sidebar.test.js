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

// Mock console.log to reduce noise in tests
global.console.log = jest.fn();

// Import the function to be tested after mocks are set up
const sidebarModule = require('./sidebar');
const { initSidebar, detectStreamlitTheme, createStyles, createSidebar, closeSidebar, adjustSidebarHeight } = sidebarModule;

describe('Sidebar Tests', () => {
  let sidebarModule;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // This ensures fresh module import each time
    
    global.parent.document.querySelectorAll = jest.fn(() => []);
    global.parent.document.getElementById = jest.fn(() => null);
    global.parent.document.querySelector = jest.fn(() => null);
    global.parent.getComputedStyle = jest.fn(() => ({ backgroundColor: 'rgb(255, 255, 255)' }));
    
    // Fresh import of the module
    sidebarModule = require('./sidebar');
  });

  describe('initSidebar', () => {
    const sidebarId = 'test-sidebar';
    const width = '300px';
    const content = '<p>Test Content</p>';

    test('should call createStyles and createSidebar', () => {
      // Mock getElementById to return null for styles check
      global.parent.document.getElementById = jest.fn(() => null);
      global.parent.document.querySelector = jest.fn(() => ({})); // Mock stApp
      
      // Create spies after module import
      const createStylesSpy = jest.spyOn(sidebarModule, 'createStyles');
      const createSidebarSpy = jest.spyOn(sidebarModule, 'createSidebar');
      
      sidebarModule.initSidebar(sidebarId, width, content);

      expect(createStylesSpy).toHaveBeenCalledWith(global.parent.document, width);
      expect(createSidebarSpy).toHaveBeenCalledWith(global.parent.document, sidebarId, content, expect.any(Function));

      createStylesSpy.mockRestore();
      createSidebarSpy.mockRestore();
    });

    test('should add resize event listener to window.parent', () => {
      // Mock the internal functions to prevent actual execution
      jest.spyOn(sidebarModule, 'createStyles').mockImplementation(() => {});
      jest.spyOn(sidebarModule, 'createSidebar').mockImplementation(() => {});
      
      sidebarModule.initSidebar(sidebarId, width, content);
      expect(global.parent.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      
      jest.restoreAllMocks();
    });
  });

  describe('detectStreamlitTheme', () => {
    test('should detect light theme correctly', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(255, 255, 255)' });
      expect(sidebarModule.detectStreamlitTheme(global.parent.document)).toBe('light');
    });

    test('should detect dark theme correctly', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(14, 17, 23)' });
      expect(sidebarModule.detectStreamlitTheme(global.parent.document)).toBe('dark');
    });

    test('should fallback to light theme if stApp is not found', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue(null);
      expect(sidebarModule.detectStreamlitTheme(global.parent.document)).toBe('light');
    });

    test('should fallback to light theme if getComputedStyle fails', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn(() => { throw new Error('Style error'); });
      expect(sidebarModule.detectStreamlitTheme(global.parent.document)).toBe('light');
    });
    
    test('should fallback to light theme if background color is not in rgb format', () => {
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'transparent' });
      expect(sidebarModule.detectStreamlitTheme(global.parent.document)).toBe('light');
    });
  });

  describe('createStyles', () => {
    test('should create style and link elements if they do not exist', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue(null);
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(255, 255, 255)' });

      sidebarModule.createStyles(global.parent.document, '300px');

      expect(global.parent.document.createElement).toHaveBeenCalledWith('style');
      expect(global.parent.document.head.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dynamic-sidebar-styles',
          textContent: expect.stringContaining('--sidebar-width: 300px;')
        })
      );
    });

    test('should use dark theme variables if dark theme is detected', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue(null);
      global.parent.document.querySelector = jest.fn().mockReturnValue({});
      global.parent.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: 'rgb(14, 17, 23)' });

      sidebarModule.createStyles(global.parent.document, '250px');

      expect(global.parent.document.head.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          textContent: expect.stringContaining('--sidebar-bg-color: #0e1117;')
        })
      );
    });

    test('should not create styles if style tag already exists', () => {
      global.parent.document.getElementById = jest.fn().mockReturnValue({});

      sidebarModule.createStyles(global.parent.document, '300px');

      expect(global.parent.document.createElement).not.toHaveBeenCalledWith('style');
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
        offsetHeight: 100,
        classList: { add: jest.fn(), remove: jest.fn() },
        querySelector: jest.fn(),
        addEventListener: jest.fn(),
        remove: jest.fn(),
      };
      global.parent.document.createElement = jest.fn(() => mockSidebarElement);
      global.parent.document.getElementById = jest.fn(() => mockSidebarElement);
      
      const mockCloseButton = { addEventListener: jest.fn() };
      mockSidebarElement.querySelector = jest.fn(selector => {
        if (selector === '.close-btn') return mockCloseButton;
        return null;
      });
    });

    test('should create sidebar element with correct properties', () => {
      const adjustSpy = jest.spyOn(sidebarModule, 'adjustSidebarHeight').mockImplementation(() => {});
      
      sidebarModule.createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);

      expect(global.parent.document.createElement).toHaveBeenCalledWith('div');
      expect(mockSidebarElement.id).toBe(sidebarId);
      expect(mockSidebarElement.className).toBe('sidebar');
      expect(mockSidebarElement.innerHTML).toContain(content);
      expect(mockSidebarElement.innerHTML).toContain('<span class="close-btn">&#xD7;</span>');
      expect(global.parent.document.body.appendChild).toHaveBeenCalledWith(mockSidebarElement);
      
      adjustSpy.mockRestore();
    });

    test('should make sidebar visible using requestAnimationFrame', () => {
      const adjustSpy = jest.spyOn(sidebarModule, 'adjustSidebarHeight').mockImplementation(() => {});
      
      sidebarModule.createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(mockSidebarElement.classList.add).toHaveBeenCalledWith('visible');
      
      adjustSpy.mockRestore();
    });

    test('should add event listener to close button', () => {
      const adjustSpy = jest.spyOn(sidebarModule, 'adjustSidebarHeight').mockImplementation(() => {});
      
      sidebarModule.createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
      const closeBtnMock = mockSidebarElement.querySelector('.close-btn');
      expect(closeBtnMock.addEventListener).toHaveBeenCalledWith('click', mockCloseCallback);
      
      adjustSpy.mockRestore();
    });

    test('should call adjustSidebarHeight', () => {
      const adjustSidebarHeightSpy = jest.spyOn(sidebarModule, 'adjustSidebarHeight');
      
      sidebarModule.createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
      
      expect(adjustSidebarHeightSpy).toHaveBeenCalledWith(global.parent.document, sidebarId);
      
      adjustSidebarHeightSpy.mockRestore();
    });

    test('should remove existing sidebars before creating a new one', () => {
      const adjustSpy = jest.spyOn(sidebarModule, 'adjustSidebarHeight').mockImplementation(() => {});
      const mockExistingSidebar = { remove: jest.fn() };
      global.parent.document.querySelectorAll = jest.fn(() => [mockExistingSidebar, mockExistingSidebar]);
      
      sidebarModule.createSidebar(global.parent.document, sidebarId, content, mockCloseCallback);
      
      expect(global.parent.document.querySelectorAll).toHaveBeenCalledWith('.sidebar');
      expect(mockExistingSidebar.remove).toHaveBeenCalledTimes(2);
      
      adjustSpy.mockRestore();
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
      sidebarModule.closeSidebar(global.parent.document, sidebarId, isClosingRef);

      expect(global.parent.document.getElementById).toHaveBeenCalledWith(sidebarId);
      expect(mockSidebarElement.classList.remove).toHaveBeenCalledWith('visible');
      expect(mockSidebarElement.addEventListener).toHaveBeenCalledWith('transitionend', expect.any(Function), { once: true });
      expect(mockSidebarElement.remove).toHaveBeenCalled();
      expect(isClosingRef.value).toBe(false);
    });

    test('should not do anything if sidebar is not found', () => {
      global.parent.document.getElementById = jest.fn(() => null);
      sidebarModule.closeSidebar(global.parent.document, sidebarId, isClosingRef);

      expect(mockSidebarElement.classList.remove).not.toHaveBeenCalled();
    });

    test('should not do anything if already closing', () => {
      isClosingRef.value = true;
      sidebarModule.closeSidebar(global.parent.document, sidebarId, isClosingRef);
      
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
      sidebarModule.adjustSidebarHeight(global.parent.document, sidebarId);
      
      expect(global.parent.document.getElementById).toHaveBeenCalledWith(sidebarId);
      expect(mockSidebarElement.style.height).toBe('768px');
    });

    test('should not do anything if sidebar is not found', () => {
      global.parent.document.getElementById = jest.fn(() => null);
      
      sidebarModule.adjustSidebarHeight(global.parent.document, sidebarId);
      
      expect(mockSidebarElement.style.height).toBeUndefined();
    });
  });
});
