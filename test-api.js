#!/usr/bin/env bun

import { generateSyllabus, generateQuiz, generateFlashcards } from './server/src/services/generator.js';
import { readFileSync } from 'fs';

// Set env variables for testing
// IMPORTANT: Never commit API keys! Use environment variables or .env files
process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

console.log('🧪 Testing StudyForge Generation APIs\n');
console.log('='.repeat(50));

// Read test content
const content = readFileSync('./test-content.txt', 'utf-8');

async function testAll() {
  try {
    // Test 1: Quiz Generation
    console.log('\n📝 Test 1: Quiz Generation (3 easy questions)');
    console.log('-'.repeat(50));
    const quiz = await generateQuiz(content, null, 'easy', 3);
    console.log(`✅ Generated ${quiz.questions.length} questions`);
    console.log(`\nSample Question:`);
    console.log(`Q: ${quiz.questions[0].question}`);
    quiz.questions[0].options.forEach((opt, i) => {
      const marker = i === quiz.questions[0].correctIndex ? '✓' : ' ';
      console.log(`  ${marker} ${i + 1}. ${opt}`);
    });
    console.log(`💡 Explanation: ${quiz.questions[0].explanation}`);

    // Test 2: Flashcards Generation
    console.log('\n\n🎴 Test 2: Flashcard Generation (5 cards)');
    console.log('-'.repeat(50));
    const flashcards = await generateFlashcards(content, 5);
    console.log(`✅ Generated ${flashcards.cards.length} flashcards`);
    console.log(`\nSample Card:`);
    console.log(`Term: ${flashcards.cards[0].term}`);
    console.log(`Definition: ${flashcards.cards[0].definition}`);
    if (flashcards.cards[0].example) {
      console.log(`Example: ${flashcards.cards[0].example}`);
    }

    // Test 3: Syllabus Generation
    console.log('\n\n📚 Test 3: Syllabus Generation');
    console.log('-'.repeat(50));
    const syllabus = await generateSyllabus(content);
    console.log(`✅ Generated syllabus with ${syllabus.chapters.length} chapters`);
    console.log(`\nSyllabus Structure:`);
    syllabus.chapters.forEach((chapter, i) => {
      console.log(`\n${i + 1}. ${chapter.title}`);
      chapter.topics.forEach((topic, j) => {
        console.log(`   ${i + 1}.${j + 1} ${topic.title}`);
      });
    });

    console.log('\n\n' + '='.repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAll();
