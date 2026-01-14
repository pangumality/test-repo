import axios from 'axios';

export const askTutor = async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Improve search query by combining context and question if appropriate
    // Simple heuristic: If question is short (likely a keyword), append context.
    let searchQuery = question;
    if (context && question.split(' ').length < 3) {
      searchQuery = `${question} ${context}`;
    }

    // 1. Search Wikipedia for relevant articles
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
    
    const searchRes = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'DoonitesLearningApp/1.0 (test@doonites.com)' }
    });
    const searchResults = searchRes.data.query?.search || [];

    if (searchResults.length === 0) {
      return res.json({ 
        answer: `I couldn't find any information about "${searchQuery}" in my database (Wikipedia). Please try asking in a different way or check your spelling.` 
      });
    }

    // 2. Get details for the top 3 results to gather better notes
    const topResults = searchResults.slice(0, 3);
    const pageIds = topResults.map(r => r.pageid).join('|');

    // Fetch the extracts (summaries) for these pages
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&pageids=${pageIds}&format=json&explaintext=true&exintro=true&origin=*`;
    
    const detailsRes = await axios.get(detailsUrl, {
      headers: { 'User-Agent': 'DoonitesLearningApp/1.0 (test@doonites.com)' }
    });
    const pages = detailsRes.data.query?.pages || {};

    // 3. Format the response by summarizing found solutions
    let answer = `Here is what I gathered about **"${searchQuery}"**:\n\n`;

    // Process pages (Wikipedia returns them keyed by ID, order not guaranteed, so we use our topResults order)
    let foundInfo = false;
    
    topResults.forEach((result, index) => {
      const pageData = pages[result.pageid];
      if (pageData && pageData.extract) {
        foundInfo = true;
        // Add a bullet point for each relevant source
        answer += `**${index + 1}. ${pageData.title}**\n${pageData.extract.substring(0, 300)}...\n\n`;
      }
    });

    if (!foundInfo) {
      answer = `I found some topics related to "${searchQuery}" but couldn't retrieve the details.`;
    } else {
      answer += `(Source: Wikipedia)`;
    }

    res.json({ answer });

  } catch (error) {
    console.error('Wiki Tutor Error:', error);
    res.status(500).json({ error: 'Failed to get answer from Wikipedia' });
  }
};
