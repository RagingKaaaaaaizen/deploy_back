const axios = require('axios');

/**
 * Local LLM service (Ollama) for generating AI-powered comparisons
 * Alternative to OpenAI for offline/private AI processing
 */
class LocalLLMService {
    constructor() {
        this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'llama2'; // Default model
        this.timeout = 60000; // 60 seconds for local processing
        this.isAvailable = false;
        
        // Check availability on initialization
        this.checkAvailability();
    }

    /**
     * Check if local LLM service is available
     * @returns {Promise<boolean>} Service availability
     */
    async checkAvailability() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                timeout: 5000
            });
            
            this.isAvailable = response.status === 200;
            console.log(`Local LLM service ${this.isAvailable ? 'available' : 'unavailable'} at ${this.baseURL}`);
            
            return this.isAvailable;
        } catch (error) {
            console.warn('Local LLM service not available:', error.message);
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Generate comparison summary using local LLM
     * @param {Object} part1 - First part data
     * @param {Object} part2 - Second part data
     * @param {Object} comparisonResult - Technical comparison results
     * @returns {Promise<Object>} AI-generated summary and recommendation
     */
    async generateComparison(part1, part2, comparisonResult) {
        try {
            if (!this.isAvailable) {
                return this.generateMockComparison(part1, part2, comparisonResult);
            }

            const prompt = this.buildComparisonPrompt(part1, part2, comparisonResult);
            
            const response = await this.callLocalLLM(prompt);
            
            return this.parseAIResponse(response);

        } catch (error) {
            console.error('Local LLM error:', error);
            return this.generateMockComparison(part1, part2, comparisonResult);
        }
    }

    /**
     * Generate specification explanation
     * @param {Object} part - Part data with specifications
     * @param {string} category - Part category
     * @returns {Promise<string>} User-friendly explanation
     */
    async explainSpecifications(part, category) {
        try {
            if (!this.isAvailable) {
                return this.generateMockExplanation(part, category);
            }

            const prompt = this.buildExplanationPrompt(part, category);
            
            const response = await this.callLocalLLM(prompt);
            
            return response.response || this.generateMockExplanation(part, category);

        } catch (error) {
            console.error('Local LLM explanation error:', error);
            return this.generateMockExplanation(part, category);
        }
    }

    /**
     * Call local LLM API
     * @param {string} prompt - Prompt text
     * @returns {Promise<Object>} LLM response
     */
    async callLocalLLM(prompt) {
        const response = await axios.post(`${this.baseURL}/api/generate`, {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,
                max_tokens: 1000
            }
        }, {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    }

    /**
     * Build comparison prompt for local LLM
     * @param {Object} part1 - First part
     * @param {Object} part2 - Second part
     * @param {Object} comparisonResult - Technical comparison
     * @returns {string} Formatted prompt
     */
    buildComparisonPrompt(part1, part2, comparisonResult) {
        return `Compare these two ${part1.category} components and provide a clear summary:

PART 1: ${part1.brand} ${part1.name}
${this.formatSpecifications(part1.specifications)}

PART 2: ${part2.brand} ${part2.name}
${this.formatSpecifications(part2.specifications)}

TECHNICAL COMPARISON:
${this.formatComparisonResult(comparisonResult)}

Provide a JSON response with:
- "summary": Clear explanation of main differences (2-3 sentences)
- "winner": Which is better ("part1", "part2", or "tie")
- "recommendation": Use case recommendations
- "confidence": Confidence level (0.0 to 1.0)
- "keyDifferences": 3-5 key differences in simple terms

Keep language simple and avoid technical jargon. Focus on what matters to users.`;
    }

    /**
     * Build explanation prompt for specifications
     * @param {Object} part - Part data
     * @param {string} category - Part category
     * @returns {string} Formatted prompt
     */
    buildExplanationPrompt(part, category) {
        return `Explain these ${category} specifications in simple terms for non-technical users:

PART: ${part.brand} ${part.name}
SPECIFICATIONS:
${this.formatSpecifications(part.specifications)}

Explain:
1. What each specification means simply
2. Whether specs are good/average/excellent
3. Best use cases for this part
4. Important considerations

Keep explanations short and easy to understand. Avoid technical jargon.`;
    }

    /**
     * Parse AI response for comparison
     * @param {Object} response - LLM response
     * @returns {Object} Parsed comparison data
     */
    parseAIResponse(response) {
        try {
            const content = response.response || '';
            
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    summary: parsed.summary || 'No summary available',
                    recommendation: parsed.winner || 'tie',
                    confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
                    keyDifferences: parsed.keyDifferences || [],
                    aiExplanation: parsed.recommendation || 'No explanation available'
                };
            } else {
                // Fallback to text parsing
                return this.parseTextResponse(content);
            }
        } catch (error) {
            console.error('Error parsing local LLM response:', error);
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
     * Parse text response when JSON parsing fails
     * @param {string} content - Response content
     * @returns {Object} Parsed comparison data
     */
    parseTextResponse(content) {
        const lines = content.split('\n').filter(line => line.trim());
        
        return {
            summary: lines.slice(0, 2).join(' ') || 'Comparison summary unavailable',
            recommendation: 'tie',
            confidence: 0.4,
            keyDifferences: lines.slice(2, 7).filter(line => line.trim()) || ['Analysis incomplete'],
            aiExplanation: content.slice(0, 200) + (content.length > 200 ? '...' : '')
        };
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
     * Generate mock comparison when LLM is unavailable
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
            confidence: 0.5,
            keyDifferences: differences.length > 0 ? differences : ['Similar performance overall'],
            aiExplanation: 'Local LLM unavailable - using basic comparison'
        };
    }

    /**
     * Generate mock explanation when LLM is unavailable
     * @param {Object} part - Part data
     * @param {string} category - Part category
     * @returns {string} Mock explanation
     */
    generateMockExplanation(part, category) {
        return `The ${part.brand} ${part.name} is a ${category} component. Local AI analysis is currently unavailable. Please refer to the technical specifications for details.`;
    }

    /**
     * Set model configuration
     * @param {string} model - Model name
     * @param {string} baseURL - Ollama base URL
     */
    setConfig(model, baseURL) {
        this.model = model;
        this.baseURL = baseURL;
        this.checkAvailability();
    }

    /**
     * Get service status
     * @returns {Object} Service status information
     */
    getStatus() {
        return {
            available: this.isAvailable,
            model: this.model,
            baseURL: this.baseURL,
            timeout: this.timeout
        };
    }

    /**
     * Get available models
     * @returns {Promise<Array>} Available models
     */
    async getAvailableModels() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                timeout: 5000
            });
            
            return response.data.models?.map(model => model.name) || [];
        } catch (error) {
            console.error('Error getting available models:', error);
            return [];
        }
    }
}

module.exports = LocalLLMService;
