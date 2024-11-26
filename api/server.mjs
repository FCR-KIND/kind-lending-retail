import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

dotenv.config();
console.log('Ideogram API Key:', process.env.IDEOGRAM_API_KEY ? 'Found' : 'Not found');

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'https://kind-lending-retail.vercel.app'],
    credentials: true
 }));

// Rate limiter configuration
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per IP
    message: { error: 'Rate limit exceeded. Please try again in 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip;
    }
});

// Apply rate limiter to generate-brand endpoint
app.use('/api/generate-brand', limiter);

// Helper function to construct name based on options
const constructName = (formData) => {
    const { prefix, firstName, lastName, useAbbreviatedName, useFirstNameOnly, useLastNameOnly } = formData;

    if (useAbbreviatedName && firstName && lastName) {
        return `${prefix ? 'The ' : ''}${firstName[0]}${lastName[0]}`;
    }
    if (useFirstNameOnly) {
        return `${prefix ? 'The ' : ''}${firstName}`;
    }
    if (useLastNameOnly) {
        return `${prefix ? 'The ' : ''}${lastName}`;
    }
    return `${prefix ? 'The ' : ''}${firstName ? firstName + ' ' : ''}${lastName}`;
};

// Helper function to get style-specific prompt additions
const getStylePrompt = (style) => {
    const stylePrompts = {
        professional: "Create a professional and corporate style with clean lines and traditional business elements.",
        modern: "Design a sleek, contemporary, and minimalist composition.",
        friendly: "Generate a warm and welcoming design with approachable elements.",
        bold: "Create a strong and impactful design with confident elements.",
        surprise: "Incorporate unexpected creative elements while maintaining professionalism.",
        eccentric: "Design a unique and artistic interpretation while keeping it business-appropriate."
    };
    return stylePrompts[style] || "";
};

// Helper function to get brand theme description
const getBrandThemePrompt = (theme) => {
    const themePrompts = {
        house: "Incorporate a professional house symbol representing property ownership.",
        handshake: "Include a handshake symbol representing trust and partnership.",
        key: "Feature a key symbol representing the milestone of closing.",
        shield: "Include a shield icon representing security and protection.",
        tree: "Include a tree symbol representing growth and stability.",
        arrow: "Incorporate a growth arrow symbolizing financial progress.",
    };
    return themePrompts[theme] || "";
};

// Download endpoint
app.get('/api/download-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).send('Image URL is required');
        }

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image');

        const buffer = await response.buffer();

        res.setHeader('Content-Disposition', 'attachment; filename=brand-image.png');
        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Failed to download image');
    }
});

// Brand image generation endpoint
app.post('/api/generate-brand', async (req, res) => {
    console.log('Received request body:', req.body);
    
    try {
        const { suffix, style, brandTheme, description } = req.body;
        
        // Construct the brand name using the helper function
        const brandName = constructName(req.body);
        
        if (!brandName || !suffix) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'Brand name and suffix are required'
            });
        }

        // Create array to store all image URLs
        let allImageUrls = [];

        // Make 4 separate requests with slightly different prompts to generate variations
        for(let i = 0; i < 4; i++) {
            // Base prompt with color specifications
            const basePrompt = "Create a professional logo with prominent colors being dark blue, light blue, orange and yellow.";
            
            // Add variation to the prompt for each iteration
            const variationPrompt = i === 0 ? "Style A: Modern and clean." :
                                  i === 1 ? "Style B: Bold and dynamic." :
                                  i === 2 ? "Style C: Elegant and professional." :
                                  "Style D: Creative and unique.";
            
            // Construct the complete prompt
            const brandingInstruction = `The text "${brandName} ${suffix}" should be prominently displayed.`;
            const styleInstruction = getStylePrompt(style);
            const themeInstruction = brandTheme ? getBrandThemePrompt(brandTheme) : '';
            const userDescription = description ? `Additional details: ${description}.` : '';

            const fullPrompt = `${basePrompt} ${brandingInstruction} ${styleInstruction} ${themeInstruction} ${userDescription} ${variationPrompt}`.trim();

            // Configure Ideogram API request
            const ideogramRequest = {
                image_request: {
                    prompt: fullPrompt,
                    aspect_ratio: "ASPECT_1_1",
                    model: "V_2",
                    magic_prompt_option: "AUTO"
                }
            };

            console.log(`Making request ${i + 1} with prompt:`, fullPrompt);

            // Make request to Ideogram API
            const response = await fetch('https://api.ideogram.ai/generate', {
                method: 'POST',
                headers: {
                    'Api-Key': process.env.IDEOGRAM_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ideogramRequest)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Response not OK:', response.status, errorData);
                throw new Error(`Ideogram API error: ${errorData}`);
            }

            const data = await response.json();
            
            if (data && data.data && data.data.length > 0 && data.data[0].url) {
                allImageUrls.push(data.data[0].url);
            }
        }

        console.log('All generated image URLs:', allImageUrls);
        console.log('Number of images generated:', allImageUrls.length);

        if (allImageUrls.length > 0) {
            res.json({ imageUrls: allImageUrls });
        } else {
            throw new Error('Failed to generate any images');
        }
        
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ 
            error: 'Image generation failed',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});