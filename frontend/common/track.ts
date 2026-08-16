import { getOrCreateDeviceId } from "./device_id";

const TRACK_ENDPOINT = "/track";

type TrackPayload = {
  project: string;
  event: string;
  device_id: string;
};

type TrackInput = {
  event: string;
  project: string;
};

const inFlightImages: HTMLImageElement[] = [];

export const buildTrackUrl = (payload: TrackPayload) => {
  const query = new URLSearchParams({
    project: payload.project,
    event: payload.event,
    device_id: payload.device_id,
  });
  return `${TRACK_ENDPOINT}?${query.toString()}`;
};

const postTrackByImage = (payload: TrackPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  const img = new Image();
  inFlightImages.push(img);
  const clear = () => {
    const index = inFlightImages.indexOf(img);
    if (index !== -1) {
      inFlightImages.splice(index, 1);
    }
  };
  img.onload = clear;
  img.onerror = clear;
  img.src = buildTrackUrl(payload);
};

export const track = ({ event, project }: TrackInput) => {
  const payload: TrackPayload = {
    project,
    event,
    device_id: getOrCreateDeviceId(),
  };

  postTrackByImage(payload);
  return payload;
};
