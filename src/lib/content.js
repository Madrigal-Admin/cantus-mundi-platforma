import { supabase } from './supabase.js'

// Toate citirile de conținut public trec prin acest fișier.
// Conținutul stă în baza de date (tabelele din supabase/migrations), nu în cod.

function fail(error) {
  throw new Error(error.message || 'Eroare la citirea conținutului')
}

export async function fetchSettings() {
  if (!supabase) throw new Error('Supabase nu este configurat.')
  const { data, error } = await supabase.from('setari_site').select('cheie, valoare')
  if (error) fail(error)
  const out = {}
  for (const r of data) out[r.cheie] = r.valoare
  return out
}

export async function fetchPage(slug) {
  const { data, error } = await supabase
    .from('pagini')
    .select('id, slug, titlu, seo, blocuri_pagina(id, pozitie, tip, date, vizibil)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) fail(error)
  if (!data) return null
  const blocks = (data.blocuri_pagina || []).filter((b) => b.vizibil).sort((a, b) => a.pozitie - b.pozitie)
  return { ...data, blocks }
}

export async function fetchNews(limit = 3) {
  const { data, error } = await supabase
    .from('articole')
    .select('id, slug, titlu, data_publicare, rezumat, imagine_url')
    .order('data_publicare', { ascending: false })
    .limit(limit)
  if (error) fail(error)
  return data
}

export async function fetchArticle(slug) {
  const { data, error } = await supabase
    .from('articole')
    .select('id, slug, titlu, data_publicare, rezumat, imagine_url, continut')
    .eq('slug', slug)
    .maybeSingle()
  if (error) fail(error)
  return data
}

export async function fetchEvents(limit = 3) {
  const { data, error } = await supabase
    .from('evenimente_publice')
    .select('id, titlu, data_start, oras, tip, stare_inscrieri')
    .order('data_start', { ascending: true })
    .limit(limit)
  if (error) fail(error)
  return data
}
