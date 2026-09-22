"use client";

import { useState } from "react";
import type { TrackMetric } from "@/lib/types";

export function TrackEditor({
  track,
  onClose,
  onSaved
}: {
  track: TrackMetric;
  onClose: () => void;
  onSaved: (track: TrackMetric) => void;
}) {
  const [title, setTitle] = useState(track.title);
  const [description, setDescription] = useState(track.description ?? "");
  const [genre, setGenre] = useState(track.genre ?? "");
  const [tagList, setTagList] = useState(track.tagList ?? "");
  const [metadataArtist, setMetadataArtist] = useState(track.metadataArtist ?? "Iyari Gomez");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");

    const response = await fetch(\`/api/soundcloud/tracks/\${encodeURIComponent(track.id)}\`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, genre, tagList, metadataArtist })
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    const updated = await response.json();
    onSaved({
      ...track,
      title: updated.title ?? title,
      description: updated.description ?? description,
      genre: updated.genre ?? genre,
      tagList: updated.tagList ?? tagList,
      metadataArtist: updated.metadataArtist ?? metadataArtist
    });
    onClose();
  }

  return (
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="track-editor glass" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
        <div className="editor-head">
          <div>
            <span className="eyebrow">BLACKMAMBA ADMIN</span>
            <h3>Editar en SoundCloud</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label>
          Artista / metadata artist
          <input value={metadataArtist} onChange={(event) => setMetadataArtist(event.target.value)} />
        </label>

        <div className="editor-columns">
          <label>
            Género
            <input value={genre} onChange={(event) => setGenre(event.target.value)} />
          </label>
          <label>
            Tags
            <input value={tagList} onChange={(event) => setTagList(event.target.value)} />
          </label>
        </div>

        <label>
          Descripción
          <textarea rows={7} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>

        <div className="editor-actions">
          <span className={status === "error" ? "editor-error" : "muted"}>
            {status === "error" ? "SoundCloud no aceptó el cambio." : "Los cambios se escriben en la pista real."}
          </span>
          <button className="primary-button" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Guardando..." : "Guardar en SoundCloud"}
          </button>
        </div>
      </form>
    </div>
  );
}
