/**
 * Test the updated parsing function with Azure OpenAI content format
 */
const testContent = `• **Understanding Root Canal Treatment**: At Test Clinic, our expert team understands that the thought of a root canal can be daunting. However, it's important to know that this procedure is designed to save your natural tooth and relieve pain.

• **Step-by-Step Procedure**: When you visit Test Clinic for a root canal, our caring team guides you through each step to ensure you feel at ease. First, we perform a thorough examination, often using digital X-rays.

• **Innovative Techniques and Technology**: At our clinic, we pride ourselves on using cutting-edge technology to enhance your root canal experience. Our expert team employs digital imaging and rotary endodontic tools.

• **High-Quality Materials for Lasting Results**: Our clinic uses only top-quality materials for root canal treatments to ensure long-lasting results. Once the canal is cleaned and shaped, we fill it with gutta-percha.

• **Expected Outcomes and Aftercare**: After a root canal treatment at Test Clinic, you can expect to regain normal function in your treated tooth without pain or discomfort.`;

function testParsingFunction() {
  console.log('🧪 Testing Updated Parsing Function...');

  // Test Azure OpenAI format parsing
  const azureRegex = /•\s*\*\*([^*]+)\*\*:\s*([^•]+?)(?=•|\s*$)/gs;
  const bulletPoints = [];

  let match;
  while ((match = azureRegex.exec(testContent)) && bulletPoints.length < 5) {
    const title = match[1].trim();
    const contentText = match[2].trim().replace(/\n\s*/g, ' ');

    if (title && contentText) {
      bulletPoints.push({
        title: title.substring(0, 60),
        content: contentText.substring(0, 200)
      });
    }
  }

  console.log(`📊 Parsed ${bulletPoints.length} bullet points:`);
  bulletPoints.forEach((point, i) => {
    console.log(`${i+1}. Title: "${point.title}"`);
    console.log(`   Content: "${point.content.substring(0, 100)}..."`);
    console.log('');
  });

  console.log(bulletPoints.length >= 3 ? '✅ Parsing test PASSED!' : '❌ Parsing test FAILED!');
}

testParsingFunction();