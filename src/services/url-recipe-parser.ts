// URL Recipe Parser Service
// Handles fetching and parsing recipe content from URLs

export interface UrlParseResult {
  success: boolean;
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  error?: string;
}

export class UrlRecipeParser {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  // Common recipe site selectors
  private static readonly RECIPE_SELECTORS = {
    title: [
      'h1[class*="recipe"]',
      'h1[class*="title"]',
      '[data-testid*="recipe-title"]',
      '.recipe-title',
      '.entry-title',
      'h1',
    ],
    description: [
      '[class*="description"]',
      '[class*="summary"]',
      '[class*="description"]',
      '[class*="summary"]',
      '.recipe-description',
      '.recipe-summary',
      '.entry-summary',
    ],
    ingredients: [
      '[class*="ingredient"]',
      '[class*="ingredients"]',
      '.recipe-ingredients',
      '.ingredients-list',
      '[data-testid*="ingredient"]',
    ],
    instructions: [
      '[class*="instruction"]',
      '[class*="direction"]',
      '[class*="step"]',
      '.recipe-instructions',
      '.instructions-list',
      '[data-testid*="instruction"]',
    ],
  };

  static async parseRecipeFromUrl(url: string): Promise<UrlParseResult> {
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid URL format',
        };
      }

      // Fetch the page content
      const content = await this.fetchPageContent(url);
      if (!content) {
        return {
          success: false,
          error: 'Failed to fetch page content',
        };
      }

      // Parse the content
      const parsed = this.parseContent(content);

      return {
        success: true,
        ...parsed,
      };
    } catch (error) {
      console.error('URL parsing error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static async fetchPageContent(url: string): Promise<string | null> {
    try {
      // Use CORS proxy to fetch content
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      return null;
    }
  }

  private static parseContent(html: string): Partial<UrlParseResult> {
    // Create a temporary DOM parser (this will work in browser)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result: Partial<UrlParseResult> = {};

    // Extract title
    result.title =
      this.extractText(doc, this.RECIPE_SELECTORS.title) || 'Untitled Recipe';

    // Extract description
    const description = this.extractText(
      doc,
      this.RECIPE_SELECTORS.description
    );
    if (description) {
      result.description = this.cleanDescriptionText(description);
    }

    // Extract ingredients
    result.ingredients = this.extractListItems(
      doc,
      this.RECIPE_SELECTORS.ingredients
    );

    // Extract instructions
    result.instructions = this.extractListItems(
      doc,
      this.RECIPE_SELECTORS.instructions
    );

    // If no structured data found, try to find text containing "Ingredients" and "Instructions"
    if (!result.ingredients?.length || !result.instructions?.length) {
      const fallbackData = this.extractFromTextContent(doc);
      if (fallbackData.ingredients?.length)
        result.ingredients = fallbackData.ingredients;
      if (fallbackData.instructions?.length)
        result.instructions = fallbackData.instructions;
      if (fallbackData.description && !result.description)
        result.description = fallbackData.description;
    }

    return result;
  }

  private static extractText(
    doc: Document,
    selectors: string[]
  ): string | null {
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  private static extractListItems(
    doc: Document,
    selectors: string[]
  ): string[] {
    for (const selector of selectors) {
      const container = doc.querySelector(selector);
      if (container) {
        const items: string[] = [];

        // Try to find list items
        const listItems = container.querySelectorAll('li, [class*="item"]');
        if (listItems.length > 0) {
          listItems.forEach(item => {
            const text = item.textContent?.trim();
            if (text) items.push(text);
          });
        } else {
          // If no list items, try to split by lines
          const text = container.textContent?.trim();
          if (text) {
            const lines = text
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0);
            items.push(...lines);
          }
        }

        if (items.length > 0) {
          return items;
        }
      }
    }
    return [];
  }

  private static extractFromTextContent(doc: Document): {
    description?: string;
    ingredients: string[];
    instructions: string[];
  } {
    const ingredients: string[] = [];
    const instructions: string[] = [];
    let description: string | undefined;

    // Find all elements that contain "Ingredients", "Instructions", or "Description"
    const allElements = doc.querySelectorAll('*');

    for (const element of allElements) {
      const text = element.textContent?.toLowerCase() || '';

      // Check if this element contains "Ingredients" and has child elements or list items
      if (text.includes('ingredients') && !text.includes('instructions')) {
        const ingredientItems = this.extractItemsFromElement(element);
        if (ingredientItems.length > 0) {
          ingredients.push(...ingredientItems);
        }
      }

      // Check if this element contains "Instructions" or similar
      if (
        (text.includes('instructions') ||
          text.includes('directions') ||
          text.includes('steps')) &&
        !text.includes('ingredients')
      ) {
        const instructionItems = this.extractItemsFromElement(element);
        if (instructionItems.length > 0) {
          instructions.push(...instructionItems);
        }
      }

      // Check if this element contains "Description" or similar
      if (
        (text.includes('description') ||
          text.includes('summary') ||
          text.includes('about')) &&
        !text.includes('ingredients') &&
        !text.includes('instructions')
      ) {
        const descriptionText = this.extractDescriptionFromElement(element);
        if (descriptionText && !description) {
          description = descriptionText;
        }
      }
    }

    // If we didn't find structured data, fall back to line-by-line parsing
    if (ingredients.length === 0 && instructions.length === 0) {
      const fallbackResult = this.parseTextByLines(doc);
      return { description, ...fallbackResult };
    }

    return { description, ingredients, instructions };
  }

  private static extractItemsFromElement(element: Element): string[] {
    const items: string[] = [];

    // Look for list items first
    const listItems = element.querySelectorAll(
      'li, [class*="item"], [class*="ingredient"], [class*="step"]'
    );
    if (listItems.length > 0) {
      listItems.forEach(item => {
        const text = item.textContent?.trim();
        if (text && text.length > 0) {
          items.push(text);
        }
      });
    } else {
      // If no list items, try to split by lines and filter out headers
      const text = element.textContent?.trim();
      if (text) {
        const lines = text
          .split('\n')
          .map(line => line.trim())
          .filter(
            line =>
              line.length > 0 &&
              !line.toLowerCase().includes('ingredients') &&
              !line.toLowerCase().includes('instructions') &&
              !line.toLowerCase().includes('directions')
          );
        items.push(...lines);
      }
    }

    return items;
  }

  private static extractDescriptionFromElement(
    element: Element
  ): string | null {
    // Look for paragraph or div elements that contain description text
    const textElements = element.querySelectorAll('p, div, span');

    for (const textElement of textElements) {
      const text = textElement.textContent?.trim();
      if (text && text.length > 20 && text.length < 500) {
        // Filter out common non-description text
        const lowerText = text.toLowerCase();
        if (
          !lowerText.includes('ingredients') &&
          !lowerText.includes('instructions') &&
          !lowerText.includes('directions') &&
          !lowerText.includes('steps') &&
          !lowerText.includes('prep time') &&
          !lowerText.includes('cook time') &&
          !lowerText.includes('serves') &&
          !lowerText.includes('yield')
        ) {
          return this.cleanDescriptionText(text);
        }
      }
    }

    // If no specific text elements found, try the element's direct text content
    const directText = element.textContent?.trim();
    if (directText && directText.length > 20 && directText.length < 500) {
      const lowerText = directText.toLowerCase();
      if (
        !lowerText.includes('ingredients') &&
        !lowerText.includes('instructions') &&
        !lowerText.includes('directions') &&
        !lowerText.includes('steps')
      ) {
        return this.cleanDescriptionText(directText);
      }
    }

    return null;
  }

  // Remove leading labels like "Description:", "Summary:", "About:", etc.
  private static cleanDescriptionText(text: string): string {
    let cleaned = text.trim();

    // Remove common leading labels with various formats
    const labelPatterns = [
      /^description\s*:?\s*/i,
      /^summary\s*:?\s*/i,
      /^about\s*:?\s*/i,
      /^intro(duction)?\s*:?\s*/i,
      /^overview\s*:?\s*/i,
      /^story\s*:?\s*/i,
    ];

    for (const pattern of labelPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
  }

  private static parseTextByLines(doc: Document): {
    ingredients: string[];
    instructions: string[];
  } {
    const ingredients: string[] = [];
    const instructions: string[] = [];

    // Get all text content
    const textContent = doc.body?.textContent || '';
    const lines = textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    let currentSection = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Check for section headers
      if (
        lowerLine.includes('ingredients') &&
        !lowerLine.includes('instructions')
      ) {
        currentSection = 'ingredients';
        continue;
      } else if (
        lowerLine.includes('instructions') ||
        lowerLine.includes('directions') ||
        lowerLine.includes('steps')
      ) {
        currentSection = 'instructions';
        continue;
      }

      // Skip empty lines and headers
      if (line.length === 0) continue;

      // Add to appropriate section
      if (currentSection === 'ingredients') {
        ingredients.push(line);
      } else if (currentSection === 'instructions') {
        instructions.push(line);
      }
    }

    return { ingredients, instructions };
  }
}
