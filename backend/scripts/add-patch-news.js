#!/usr/bin/env node

/**
 * Script para agregar post de noticias del Parche 1.11.0
 * Simula la publicación de una noticia oficial
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function addPatchNews() {
  const client = new MongoClient(process.env.MONGODB_URI || process.env.VITE_MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('arc_raiders');
    const postsCollection = db.collection('community_posts');
    const usersCollection = db.collection('users');
    
    console.log('📰 Agregando post de noticias del Parche 1.11.0...\n');
    
    // Buscar o crear un usuario "System" para las noticias
    let systemUser = await usersCollection.findOne({ username: 'ArcNews' });
    
    if (!systemUser) {
      console.log('➕ Creando usuario "ArcNews" para publicaciones del sistema...');
      const result = await usersCollection.insertOne({
        username: 'ArcNews',
        email: 'news@arcraiders.com',
        password: 'system-account-no-login',
        role: 'admin',
        created_at: new Date(),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArcNews',
        verified: true
      });
      systemUser = { _id: result.insertedId, username: 'ArcNews' };
    }
    
    const patchPost = {
      user_id: systemUser._id,
      username: 'ArcNews',
      title: '🎮 JANUARY UPDATE 1.11.0 - ABYSS COSMETIC SET & BALANCING CHANGES',
      content: `# JANUARY UPDATE 1.11.0

Hey, Raiders!

Update 1.11.0 is rolling out on all platforms and it brings the highly anticipated **Abyss cosmetic set** along with some fixes and balancing changes to the Trigger 'Nade and Kettle. Restart your client to download.

## 🎉 MILESTONE: 12 MILLION COPIES SOLD!

We are also celebrating a huge milestone - **12 million ARC Raiders copies sold!** We prepared a gift for reaching 10 million players, but you blew right past it over the holidays... we're not complaining! 

**Everyone who has logged in since launch until Jan 13 11:59pm CET / Jan 13 2:59pm PST / Jan 13 5:59pm EST can pick up the Gilded Pickaxe Raider Tool.**

---

## ⚔️ WEAPON BALANCING

### Kettle (Marksman Rifle)
**Change:** Reduced fire rate from 600 to 450

**Dev note:** The previous fire rate was only realistically reachable by players using macros, which creates an unfair dynamic that favours using 3rd party software.

---

### Trigger 'Nade (Grenade)
**Changes:**
- Increased detonation delay from 0.7s to 1.5s
- Rebalanced damage falloff to concentrate closer to explosion center
- Reduced damage further from explosion point

**Dev note:** Trigger 'Nade currently dominates PVP encounters, and players favour picking it over all our other grenades. This nerf aims to make it less usable as a "trigger-in-air" grenade, whilst keeping its usefulness as a sticky bomb. The delay gives players more time to react, and makes it harder to time the detonation in air.

---

## 🐛 BUG FIXES & IMPROVEMENTS

✅ **Fixed key card exploit** - Players could keep room keys after using them
✅ **Stella Montis Night Raid lighting** - Lowered lighting in some areas making flashlights and listening more relevant

---

## 📦 NEW COSMETICS

The highly anticipated **Abyss cosmetic set** is now available! Check the cosmetics store for outfits, backpacks, charms, and gestures.

---

**See you Topside!**
//Ossen

---

**Official Source:** https://arcraiders.com/es/news/patch-notes-1-11-0`,
      category: 'News',
      tags: ['patch', 'update', '1.11.0', 'abyss', 'balancing', 'kettle', 'trigger-nade'],
      votes: { upvotes: [], downvotes: [] },
      likes: [],
      is_pinned: true,
      is_locked: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await postsCollection.insertOne(patchPost);
    
    console.log('✅ Post agregado exitosamente!\n');
    console.log(`📝 Post ID: ${result.insertedId}`);
    console.log(`👤 Autor: ${patchPost.username}`);
    console.log(`📌 Fijado: Sí (pinned)`);
    console.log(`📊 Categoría: ${patchPost.category}`);
    console.log(`🏷️ Tags: ${patchPost.tags.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

addPatchNews();
