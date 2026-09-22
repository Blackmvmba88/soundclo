"use client";

import { useMemo, useState } from "react";
import { CURATION_LABELS, curationIssues } from "@/lib/curation";
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
  const [metadataArtist, setMetadataArtist] = useState(track.metadataArtist ?? "");
  const [artwork, setArtwork] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(track.artworkUrl ?? null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const issues = useMemo(() => curationIssues(track), [track]);

  function chooseArtwork(file: File | null) {
    setArtwork(file);
    if (!file) {
      setArtworkPreview(track.artworkUrl ?? null);
      return;
    }
    setArtworkPreview(URL.createObjectURL(file));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const body = new FormData();
    body.append("title", title);
    body.append("description", description);
    body.append("genre", genre);
    body.append("tagList", tagList);
    body.append("metadataArtist", metadataArtist);
    if (artwork) body.append("artwork", artwork);

    const response = await fetch(
      `/api/soundcloud/tracks/${encodeURIComponent(track.id)}`,
      {
        method: "PUT",
        body
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setErrorMessage(payload?.error ?? "SoundCloud no aceptó el cambio.");
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
      metadataArtist: updated.metadataArtist ?? metadataArtist,
      artworkUrl: updated.artworkUrl ?? artworkPreview ?? track.artworkUrl
    });
    onClose();
  }

  return (
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="track-editor glass"
        onSubmit={save}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="editor-head">
          <div>
            <span className="eyebrow">BLACKMAMBA CURATION</span>
            <h3>Curar pista</h3>
            <div className="editor-issues">
              {issues.length ? (
                issues.map((issue) => (
                  <span key={issue}>{CURATION_LABELS[issue]} faltante</span>
                ))
              ) : (
                <span className="is-clean">Metadata completa</span>
              )}
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="artwork-editor">
          <div className={`artwork-preview ${artworkPreview ? "" : "is-missing"}`}>
            {artworkPreview ? <img src={artworkPreview} alt="Portada" /> : <span>NO COVER</span>}
          </div>
          <label className="artwork-picker">
            Portada
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => chooseArtwork(event.target.files?.[0] ?? null)}
            />
            <strong>{artwork ? artwork.name : track.artworkUrl ? "Cambiar portada" : "Agregar portada"}</strong>
            <small>PNG, JPG o WEBP · máximo 12 MB</small>
          </label>
        </div>

        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label className={!metadataArtist.trim() ? "field-missing" : ""}>
          Artista / metadata artist
          <input
            value={metadataArtist}
            onChange={(event) => setMetadataArtist(event.target.value)}
            placeholder="Iyari Gomez"
          />
        </label>

        <div className="editor-columns">
          <label className={!genre.trim() ? "field-missing" : ""}>
            Género
            <input
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              placeholder="Reggae, Dub, Dancehall..."
            />
          </label>
          <label className={!tagList.trim() ? "field-missing" : ""}>
            Tags
            <input
              value={tagList}
              onChange={(event) => setTagList(event.target.value)}
              placeholder="blackmamba iyari reggae..."
            />
          </label>
        </div>

        <label className={!description.trim() ? "field-missing" : ""}>
          Descripción
          <textarea
            rows={7}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Créditos, contexto, enlaces o notas de la canción..."
          />
        </label>

        <div className="editor-actions">
          <span className={status === "error" ? "editor-error" : "muted"}>
            {status === "error"
              ? errorMessage
              : "Guardar actualiza la pista real en SoundCloud."}
          </span>
          <button className="primary-button" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Curando..." : "Guardar curación"}
          </button>
        </div>
      </form>
    </div>
  );
}
