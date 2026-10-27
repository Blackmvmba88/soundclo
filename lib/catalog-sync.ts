export type SoundCloudTrack = {
  id: number | string; sharing: string; title?: string; playback_count?: number;
  likes_count?: number; favoritings_count?: number; comment_count?: number;
  reposts_count?: number; duration?: number; artwork_url?: string;
  permalink_url?: string; genre?: string; metadata_artist?: string;
};
type Page = {collection: SoundCloudTrack[]; next_href?: string | null};
export async function fetchPublicCatalog(fetchPage: (url:string)=>Promise<Page>, maxPages=100) {
  const tracks = new Map<string,SoundCloudTrack>();
  const visited = new Set<string>();
  let next:string|null='/me/tracks?limit=100&linked_partitioning=true';
  let pages=0;
  while(next) {
    if(pages++>=maxPages || visited.has(next)) throw new Error('Incomplete pagination');
    visited.add(next);
    const page=await fetchPage(next);
    if(!page || !Array.isArray(page.collection)) throw new Error('Invalid catalog page');
    for(const t of page.collection) {
      if(t.sharing==='public' && t.id!=null) tracks.set(String(t.id),t);
    }
    next=page.next_href??null;
  }
  return [...tracks.values()];
}
