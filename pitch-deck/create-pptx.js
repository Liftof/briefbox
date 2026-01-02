const pptxgen = require('pptxgenjs');
const path = require('path');

// Import html2pptx from local copy
const html2pptx = require('./html2pptx.js');

async function createPresentation() {
    const pptx = new pptxgen();

    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Palette';
    pptx.title = 'Palette - Pitch Deck';
    pptx.subject = 'Brand visuals in 60 seconds';

    const slidesDir = path.join(__dirname, 'slides');

    // Slide 1: Title
    console.log('Creating slide 1: Title...');
    await html2pptx(path.join(slidesDir, 'slide1-title.html'), pptx);

    // Slide 2: Problem
    console.log('Creating slide 2: Problem...');
    await html2pptx(path.join(slidesDir, 'slide2-problem.html'), pptx);

    // Slide 3: Solution
    console.log('Creating slide 3: Solution...');
    await html2pptx(path.join(slidesDir, 'slide3-solution.html'), pptx);

    // Slide 4: Features
    console.log('Creating slide 4: Features...');
    await html2pptx(path.join(slidesDir, 'slide4-features.html'), pptx);

    // Slide 5: Pricing
    console.log('Creating slide 5: Pricing...');
    await html2pptx(path.join(slidesDir, 'slide5-pricing.html'), pptx);

    // Save the presentation
    const outputPath = path.join(__dirname, 'Palette-Pitch-Deck.pptx');
    await pptx.writeFile({ fileName: outputPath });

    console.log(`\nPresentation created successfully!`);
    console.log(`Output: ${outputPath}`);
}

createPresentation().catch(err => {
    console.error('Error creating presentation:', err);
    process.exit(1);
});
