import { AppError } from "../errors/AppError.js";
import { Profile } from "../../modules/profiles/profile.model.js";

export async function assertProfileOwnership(profileId, userId) {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Không tìm thấy profile");
  }
  return profile;
}

