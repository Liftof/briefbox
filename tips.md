# Nano Banana Pro - Advanced Capabilities & Tips

Documentation and best practices for maximizing the potential of the Nano Banana Pro model (Google/Vertex AI based).

## 🧠 1. Thinking Mode (Reasoning)
The model can "think" before generating, explaining its creative decisions.
*   **How:** Set `include_thoughts=True` in `thinking_config`.
*   **Value:** Great for debugging "weird" results or showing the user the "AI's Director Cut" (why it chose this composition).
*   **Output:** Returns a text `thought` alongside the image.

## 🌐 2. Search Grounding (Real-Time Data)
The model can access Google Search to include up-to-date information in visuals.
*   **How:** Enable `tools=[{"google_search": {}}]`.
*   **Use Cases:**
    *   "Visualise la météo de demain à Paris"
    *   "Infographie sur les derniers résultats du CAC40"
    *   "Carte des tendances Twitter du jour"

## 📐 3. Resolutions (1K vs 4K)
*   **Standard:** `1K` (Faster, cheaper).
*   **High-Res:** `4K` (Print quality, slower, more expensive).
*   **Implementation:** `image_config: { image_size: "4K" }` (Case sensitive!).

## 🗣️ 4. Multilingual Text & Translation
The model is excellent at rendering coherent text in images (unlike older diffusion models).
*   **Capabilities:** Can translate text within an infographic while keeping layout.
*   **Tip:** Be explicit about the language in the prompt: *"Make an infographic in Spanish"*.

## 🎨 5. Advanced Image Mixing (Collage)
*   **Capacity:** Up to **14 reference images** (vs 3 for Flash model).
*   **Best Practice:**
    *   Use 1-5 images for high fidelity of characters/products.
    *   Use 6-14 for moodboards, collages, or complex group scenes.
    *   We currently limit to ~5 in Smart Selection, which is safe, but we could expand for "Moodboard" modes.

## 💡 Prompting Best Practices
1.  **Be Hyper-Specific:** Lighting, composition, camera angle ("low-angle", "macro").
2.  **Positive Framing:** Describe what you *want*, not just what you don't want.
3.  **Step-by-Step:** For complex scenes, break it down.
4.  **Context:** Explain the *intent* (e.g., "for a luxury social media campaign").

## 🛠️ Integration Notes (Fal.ai vs Direct)
*   Our current integration via Fal.ai (`fal-ai/nano-banana-pro/edit`) might abstract some of these parameters.
*   **To Explore:** Check if `thinking_config` or `tools` can be passed in the `input` object of the Fal subscription.

