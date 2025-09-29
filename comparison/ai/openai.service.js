const axios = require('axios');

/**
 * OpenAI API service for generating AI-powered comparisons
 */
class OpenAIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || null;
        this.baseURL = 'https://api.openai.com/v1';
        this.model = 'gpt-3.5-turbo'; // Default model, can be overridden
        this.maxTokens = 1000;
        this.temperature = 0.7;
        
        if (!this.apiKey) {
            console.warn('OpenAI API key not found. AI features will use mock responses.');
        }
    }

    /**
     * Generate comparison summary using OpenAI
     * @param {Object} part1 - First part data
     * @param {Object} part2 - Second part data
     * @param {Object} comparisonResult - Technical comparison results
     * @returns {Promise<Object>} AI-generated summary and recommendation
     */
    async generateComparison(part1, part2, comparisonResult) {
        try {
            if (!this.apiKey) {
                return this.generateMockComparison(part1, part2, comparisonResult);
            }

            const prompt = this.buildComparisonPrompt(part1, part2, comparisonResult);
            
            const response = await this.callOpenAI(prompt);
            
            return this.parseAIResponse(response);

        } catch (error) {
            console.error('OpenAI API error:', error);
            // Fallback to mock response
            return this.generateMockComparison(part1, part2, comparisonResult);
        }
    }

    /**
     * Generate specification explanation for non-technical users
     * @param {Object} part - Part data with specifications
     * @param {string} category - Part category
     * @returns {Promise<string>} User-friendly explanation
     */
    async explainSpecifications(part, category) {
        try {
            if (!this.apiKey) {
                return this.generateMockExplanation(part, category);
            }

            const prompt = this.buildExplanationPrompt(part, category);
            
            const response = await this.callOpenAI(prompt);
            
            return response.choices[0].message.content.trim();

        } catch (error) {
            console.error('OpenAI explanation error:', error);
            return this.generateMockExplanation(part, category);
        }
    }

    /**
     * Generate upgrade recommendation
     * @param {Object} currentPart - Current part
     * @param {Array} availableParts - Available upgrade options
     * @param {string} useCase - User's use case (gaming, work, etc.)
     * @returns {Promise<Object>} Upgrade recommendation
     */
    async generateUpgradeRecommendation(currentPart, availableParts, useCase) {
        try {
            if (!this.apiKey) {
                return this.generateMockUpgradeRecommendation(currentPart, availableParts, useCase);
            }

            const prompt = this.buildUpgradePrompt(currentPart, availableParts, useCase);
            
            const response = await this.callOpenAI(prompt);
            
            return this.parseUpgradeResponse(response);

        } catch (error) {
            console.error('OpenAI upgrade recommendation error:', error);
            return this.generateMockUpgradeRecommendation(currentPart, availableParts, useCase);
        }
    }

    /**
     * Build comparison prompt for OpenAI
     * @param {Object} part1 - First part
     * @param {Object} part2 - Second part
     * @param {Object} comparisonResult - Technical comparison
     * @returns {string} Formatted prompt
     */
    buildComparisonPrompt(part1, part2, comparisonResult) {
        const prompt = `You are a helpful PC hardware expert. Compare these two ${part1.category} components and provide a clear, non-technical summary.

PART 1: ${part1.brand} ${part1.name}
${this.formatSpecifications(part1.specifications)}

PART 2: ${part2.brand} ${part2.name}
${this.formatSpecifications(part2.specifications)}

TECHNICAL COMPARISON:
${this.formatComparisonResult(comparisonResult)}

Please provide a JSON response with:
1. "summary": A clear, non-technical explanation of the main differences (2-3 sentences)
2. "winner": Which part is better overall ("part1", "part2", or "tie")
3. "recommendation": Specific recommendation for different use cases
4. "confidence": Your confidence level (0.0 to 1.0)
5. "keyDifferences": Array of 3-5 key differences in simple terms

Keep the language simple and avoid technical jargon. Focus on what matters most to users.`;

        return prompt;
    }

    /**
     * Build explanation prompt for specifications
     * @param {Object} part - Part data
     * @param {string} category - Part category
     * @returns {string} Formatted prompt
     */
    buildExplanationPrompt(part, category) {
        const prompt = `Explain these ${category} specifications in simple, non-technical terms for someone who doesn't know much about computer hardware.

PART: ${part.brand} ${part.name}
SPECIFICATIONS:
${this.formatSpecifications(part.specifications)}

Please explain:
1. What each specification means in simple terms
2. Whether these specs are good, average, or excellent
3. What this part would be best used for
4. Any important considerations

Keep explanations short and easy to understand. Avoid technical jargon.`;

        return prompt;
    }

    /**
     * Build upgrade recommendation prompt
     * @param {Object} currentPart - Current part
     * @param {Array} availableParts - Available upgrades
     * @param {string} useCase - Use case
     * @returns {string} Formatted prompt
     */
    buildUpgradePrompt(currentPart, availableParts, useCase) {
        const partsList = availableParts.map((part, index) => 
            `${index + 1}. ${part.brand} ${part.name} - ${part.price ? `$${part.price}` : 'Price not available'}`
        ).join('\n');

        const prompt = `I have a ${currentPart.brand} ${currentPart.name} and want to upgrade for ${useCase}. Here are my options:

CURRENT PART:
${currentPart.brand} ${currentPart.name}
${this.formatSpecifications(currentPart.specifications)}

AVAILABLE UPGRADES:
${partsList}

Please provide a JSON response with:
1. "recommendedPart": Index number of the best upgrade option
2. "reason": Why this is the best choice for ${useCase}
3. "improvement": What improvements I'll see
4. "costBenefit": Whether the upgrade is worth the cost
5. "alternatives": Other good options if budget is a concern

Consider performance improvement, value for money, and suitability for ${useCase}.`;

        return prompt;
    }

    /**
     * Call OpenAI API
     * @param {string} prompt - Prompt text
     * @returns {Promise<Object>} API response
     */
    async callOpenAI(prompt) {
        const response = await axios.post(`${this.baseURL}/chat/completions`, {
            model: this.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful PC hardware expert who explains things in simple, non-technical terms. Always respond with valid JSON when requested.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        return response.data;
    }

    /**
     * Parse AI response for comparison
     * @param {Object} response - OpenAI API response
     * @returns {Object} Parsed comparison data
     */
    parseAIResponse(response) {
        try {
            const content = response.choices[0].message.content;
            const parsed = JSON.parse(content);
            
            return {
                summary: parsed.summary || 'No summary available',
                recommendation: parsed.winner || 'tie',
                confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
                keyDifferences: parsed.keyDifferences || [],
                aiExplanation: parsed.recommendation || 'No explanation available'
            };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return {
                summary: 'Unable to generate comparison summary',
                recommendation: 'tie',
                confidence: 0.1,
                keyDifferences: ['Comparison unavailable'],
                aiExplanation: 'AI analysis failed'
            };
        }
    }

    /**
     * Parse AI response for upgrade recommendation
     * @param {Object} response - OpenAI API response
     * @returns {Object} Parsed upgrade data
     */
    parseUpgradeResponse(response) {
        try {
            const content = response.choices[0].message.content;
            const parsed = JSON.parse(content);
            
            return {
                recommendedPart: parsed.recommendedPart || 0,
                reason: parsed.reason || 'No recommendation available',
                improvement: parsed.improvement || 'Improvement details unavailable',
                costBenefit: parsed.costBenefit || 'Cost-benefit analysis unavailable',
                alternatives: parsed.alternatives || []
            };
        } catch (error) {
            console.error('Error parsing upgrade response:', error);
            return {
                recommendedPart: 0,
                reason: 'Unable to generate recommendation',
                improvement: 'Analysis failed',
                costBenefit: 'Unable to assess value',
                alternatives: []
            };
        }
    }

    /**
     * Format specifications for prompts
     * @param {Object} specifications - Part specifications
     * @returns {string} Formatted specifications
     */
    formatSpecifications(specifications) {
        if (!specifications || Object.keys(specifications).length === 0) {
            return 'No specifications available';
        }

        return Object.entries(specifications)
            .map(([key, spec]) => {
                const name = spec.name || key;
                const value = spec.value || spec;
                const unit = spec.unit || '';
                return `- ${name}: ${value} ${unit}`.trim();
            })
            .join('\n');
    }

    /**
     * Format comparison results for prompts
     * @param {Object} comparisonResult - Technical comparison
     * @returns {string} Formatted comparison
     */
    formatComparisonResult(comparisonResult) {
        if (!comparisonResult || !comparisonResult.specs) {
            return 'No technical comparison available';
        }

        return Object.entries(comparisonResult.specs)
            .map(([spec, data]) => {
                const part1Value = data.part1?.value || 'N/A';
                const part2Value = data.part2?.value || 'N/A';
                const winner = data.winner === 'part1' ? 'Part 1' : 
                             data.winner === 'part2' ? 'Part 2' : 'Tie';
                return `- ${spec}: Part 1 (${part1Value}) vs Part 2 (${part2Value}) - Winner: ${winner}`;
            })
            .join('\n');
    }

    /**
     * Generate mock comparison when AI is unavailable
     * @param {Object} part1 - First part
     * @param {Object} part2 - Second part
     * @param {Object} comparisonResult - Technical comparison
     * @returns {Object} Mock comparison data
     */
    generateMockComparison(part1, part2, comparisonResult) {
        const differences = [];
        
        if (comparisonResult && comparisonResult.differences) {
            comparisonResult.differences.forEach(diff => {
                if (diff.winner !== 'tie') {
                    differences.push(`${diff.spec}: ${diff.winner === 'part1' ? part1.name : part2.name} is better`);
                }
            });
        }

        return {
            summary: `Comparing ${part1.name} with ${part2.name}. Both are ${part1.category} components with different specifications.`,
            recommendation: comparisonResult?.winner || 'tie',
            confidence: 0.6,
            keyDifferences: differences.length > 0 ? differences : ['Similar performance overall'],
            aiExplanation: 'AI analysis unavailable - using basic comparison'
        };
    }

    /**
     * Generate mock explanation when AI is unavailable
     * @param {Object} part - Part data
     * @param {string} category - Part category
     * @returns {string} Mock explanation
     */
    generateMockExplanation(part, category) {
        return `The ${part.brand} ${part.name} is a ${category} component. While detailed specifications are available, AI-powered explanation is currently unavailable. Please refer to the technical specifications for more details.`;
    }

    /**
     * Generate mock upgrade recommendation when AI is unavailable
     * @param {Object} currentPart - Current part
     * @param {Array} availableParts - Available parts
     * @param {string} useCase - Use case
     * @returns {Object} Mock recommendation
     */
    generateMockUpgradeRecommendation(currentPart, availableParts, useCase) {
        return {
            recommendedPart: 0,
            reason: `AI-powered upgrade analysis is currently unavailable. Consider comparing specifications manually for ${useCase}.`,
            improvement: 'Unable to assess improvements without AI analysis',
            costBenefit: 'Manual cost-benefit analysis recommended',
            alternatives: availableParts.slice(0, 2).map((part, index) => `Option ${index + 1}: ${part.brand} ${part.name}`)
        };
    }

    /**
     * Set API configuration
     * @param {Object} config - Configuration object
     */
    setConfig(config) {
        if (config.apiKey) this.apiKey = config.apiKey;
        if (config.model) this.model = config.model;
        if (config.maxTokens) this.maxTokens = config.maxTokens;
        if (config.temperature) this.temperature = config.temperature;
    }

    /**
     * Check if service is available
     * @returns {boolean} Service availability
     */
    isAvailable() {
        return !!this.apiKey;
    }

    /**
     * Get service status
     * @returns {Object} Service status information
     */
    getStatus() {
        return {
            available: this.isAvailable(),
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            hasApiKey: !!this.apiKey
        };
    }
}

module.exports = OpenAIService;
