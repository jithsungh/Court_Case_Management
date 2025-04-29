// Cloudinary configuration for client-side uploads
const CLOUDINARY_CLOUD_NAME = "dp1acglry";
const UPLOAD_PRESET = "caseflow_uploads"; // Upload preset name for unsigned uploads

export const uploadToCloudinary = async (
  file: File,
  folder = "general"
): Promise<string> => {
  try {
    console.log(`Uploading file to Cloudinary (${folder}):`, file.name);

    // Create a new FormData instance
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET); // Add upload preset
    formData.append("folder", folder);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    // Log the upload URL being used
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    console.log("Cloudinary upload URL:", uploadUrl);
    console.log("Upload preset being used:", UPLOAD_PRESET);

    // Make the upload request
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    // Get the response as text first for better error logging
    const responseText = await response.text();

    // Handle non-successful response
    if (!response.ok) {
      console.error(
        "Cloudinary API responded with error status:",
        response.status,
        responseText
      );

      // Provide more descriptive error messages based on common error codes
      if (response.status === 400) {
        throw new Error(
          `Cloudinary upload failed: ${response.status} - ${responseText}`
        );
      } else if (response.status === 401) {
        throw new Error(
          `Cloudinary authorization failed: Please check your credentials`
        );
      } else if (response.status === 404) {
        throw new Error(
          `Cloudinary resource not found: The API endpoint may be incorrect`
        );
      } else if (response.status === 413) {
        throw new Error(
          `File too large: The file exceeds Cloudinary's size limit`
        );
      } else {
        throw new Error(
          `Cloudinary upload failed: ${response.status} - ${responseText}`
        );
      }
    }

    try {
      // Parse the JSON response
      const data = JSON.parse(responseText);
      console.log("Cloudinary upload successful:", data);

      // Verify we received the secure_url
      if (!data.secure_url) {
        console.error("Cloudinary response missing secure_url:", data);
        throw new Error("Cloudinary response missing secure_url");
      }

      return data.secure_url;
    } catch (parseError) {
      console.error("Error parsing Cloudinary response:", parseError);
      throw new Error(`Failed to parse Cloudinary response: ${responseText}`);
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", error);
    }

    // Rethrow a more user-friendly error
    throw new Error(
      `File upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getCloudinaryPublicId = (url: string): string => {
  // Extract the public ID from a Cloudinary URL
  const regex = /\/v\d+\/([^/]+)\.\w+$/;
  const match = url.match(regex);
  return match ? match[1] : "";
};
