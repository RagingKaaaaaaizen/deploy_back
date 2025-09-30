# AI Configuration Guide

## 🤖 Setting Up AI Services for PC Parts Comparison

This guide explains how to configure AI services for generating user-friendly comparison descriptions.

---

## 🔧 **Configuration Options**

### **API Provider Setup (DigiKey)**

Your system is configured to use DigiKey as the primary API provider for fetching PC hardware data.

#### **Environment Variables:**
```bash
# DigiKey API Configuration
DIGIKEY_CLIENT_ID=your_digikey_client_id
DIGIKEY_CLIENT_SECRET=your_digikey_client_secret
```

#### **Quick Setup:**
Use the provided setup scripts to automatically configure both DigiKey and Gemini:
- **Windows Batch**: `setup-digikey-gemini.bat`
- **PowerShell**: `./setup-digikey-gemini.ps1`

---

### **1. Google Gemini Integration (Recommended - FREE!)**

Google Gemini provides excellent AI responses with a generous free tier - perfect for getting started!

#### **Setup Steps:**
1. **Get API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Create Account**: Sign up with Google account (free)
3. **Generate Key**: Create a new API key (no payment required)
4. **Set Environment Variable**: Add to your environment

#### **Environment Variables:**
```bash
# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
```

#### **Costs:**
- **Gemini Pro**: FREE up to 60 requests per minute
- **Monthly Limit**: 1,500 requests per day (45,000/month)
- **Perfect for**: Development and small to medium usage
- **No credit card required**

---

### **2. OpenAI Integration (Premium)**

OpenAI provides the most reliable AI responses for technical comparisons (paid service).

#### **Setup Steps:**
1. **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Create Account**: Sign up and add payment method
3. **Generate Key**: Create a new API key
4. **Set Environment Variable**: Add to your environment

#### **Environment Variables:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

#### **Costs:**
- **GPT-3.5-turbo**: ~$0.002 per comparison
- **GPT-4**: ~$0.06 per comparison (higher quality)
- **Monthly Estimate**: $5-20 for typical usage

---

### **3. Local LLM Integration (Free Alternative)**

Use Ollama to run AI models locally without API costs.

#### **Setup Steps:**
1. **Install Ollama**: Visit [ollama.ai](https://ollama.ai) and download
2. **Install Model**: Run `ollama pull llama2`
3. **Start Service**: Ollama runs automatically on port 11434
4. **Configure Environment**: Set Ollama URL

#### **Environment Variables:**
```bash
# Local LLM Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

#### **Available Models:**
- **llama2**: Good balance of speed and quality
- **codellama**: Better for technical content
- **mistral**: Fast and efficient
- **neural-chat**: Optimized for conversations

#### **Hardware Requirements:**
- **Minimum**: 8GB RAM, 4GB VRAM
- **Recommended**: 16GB RAM, 8GB VRAM
- **Storage**: 4-20GB per model

---

### **4. No AI Configuration (Fallback Mode)**

If no AI services are configured, the system uses intelligent fallback responses.

#### **Fallback Features:**
- Basic technical comparisons
- Specification-based recommendations
- Simple winner determination
- No additional setup required

---

## ⚙️ **Configuration Methods**

### **Method 1: Environment Variables (Recommended)**

Create a `.env` file in the `deploy_back` directory:

```bash
# Copy this template
cp AI_CONFIGURATION_GUIDE.md .env

# Edit with your settings
nano .env
```

### **Method 2: System Environment Variables**

Set variables in your system:

```bash
# Windows (PowerShell)
$env:OPENAI_API_KEY="sk-your-key-here"

# Windows (Command Prompt)
set OPENAI_API_KEY=sk-your-key-here

# Linux/Mac
export OPENAI_API_KEY="sk-your-key-here"
```

### **Method 3: Runtime Configuration**

Configure AI services at runtime:

```javascript
const aiManager = require('./ai/ai-manager.service');

// Configure OpenAI
aiManager.configureProvider('openai', {
    apiKey: 'sk-your-key-here',
    model: 'gpt-4',
    maxTokens: 1500,
    temperature: 0.5
});

// Configure Local LLM
aiManager.configureProvider('local-llm', {
    model: 'mistral',
    baseURL: 'http://localhost:11434'
});
```

---

## 🧪 **Testing Your Configuration**

### **Test AI Services:**

1. **Start the server**:
   ```bash
   npm run start:dev
   ```

2. **Check AI status** (Admin only):
   ```bash
   GET /api/comparison/ai-stats
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

3. **Test AI explanation**:
   ```bash
   GET /api/comparison/explain-specifications/1?providerHint=openai
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

4. **Test AI comparison**:
   ```bash
   POST /api/comparison/compare-parts
   {
     "part1Id": 1,
     "part2Id": 2,
     "comparisonType": "inventory_vs_inventory"
   }
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

---

## 📊 **Performance Comparison**

| Service | Response Time | Quality | Cost | Setup |
|---------|---------------|---------|------|-------|
| **Gemini** | 2-4 seconds | Excellent | FREE | Easy |
| **OpenAI** | 2-5 seconds | Excellent | $5-20/month | Easy |
| **Local LLM** | 5-15 seconds | Good | Free | Medium |
| **Fallback** | <1 second | Basic | Free | None |

---

## 🔒 **Security Considerations**

### **API Key Security:**
- Never commit API keys to version control
- Use environment variables or secure config files
- Rotate keys regularly
- Monitor usage for unexpected costs

### **Data Privacy:**
- **OpenAI**: Data may be processed on their servers
- **Local LLM**: All processing happens locally
- **Fallback**: No external data transmission

---

## 🚀 **Getting Started Recommendations**

### **For Development:**
1. Start with **Gemini** (free, excellent quality)
2. Add **OpenAI** for comparison testing
3. Consider **Local LLM** for offline development

### **For Production:**
1. **Primary**: Gemini for excellent free service
2. **Secondary**: OpenAI for premium features
3. **Fallback**: Local LLM or fallback mode for reliability

### **For Enterprise:**
1. **Self-hosted**: Local LLM for data privacy
2. **Hybrid**: OpenAI + Local LLM for reliability
3. **Custom**: Train your own models for specific needs

---

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **OpenAI API Errors:**
- Check API key validity
- Verify billing account has credits
- Monitor rate limits (60 requests/minute)

#### **Local LLM Issues:**
- Ensure Ollama is running: `ollama list`
- Check model installation: `ollama pull llama2`
- Verify port 11434 is accessible

#### **No AI Responses:**
- Check environment variables are set
- Verify AI service availability in logs
- Test with different provider hints

### **Debug Commands:**

```bash
# Check OpenAI connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check Ollama connectivity
curl http://localhost:11434/api/tags

# Check AI service status
curl -H "Authorization: Bearer YOUR_JWT" http://localhost:4000/api/comparison/ai-stats
```

---

## 📈 **Monitoring and Optimization**

### **Key Metrics to Monitor:**
- **Response Time**: Target <5 seconds
- **Success Rate**: Target >95%
- **Cost per Comparison**: Monitor monthly spending
- **User Satisfaction**: Track comparison completion rates

### **Optimization Tips:**
- Use appropriate model for your needs
- Implement caching for repeated comparisons
- Batch similar requests when possible
- Monitor and adjust temperature settings

---

## 🎯 **Next Steps**

1. **Choose your AI provider** based on needs and budget
2. **Configure environment variables** using this guide
3. **Test the setup** with the provided test commands
4. **Monitor performance** and adjust as needed
5. **Scale up** as usage increases

---

*Your PC parts comparison system is now ready for intelligent, user-friendly AI-powered comparisons!* 🚀
