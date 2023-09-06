const { StorageSharedKeyCredential, BlobServiceClient } = require("@azure/storage-blob");
const { STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY, STORAGE_CONTAINER_NAME } = process.env;

module.exports = async function uploadFile(context, req) {
  const { blobName, base64content } = req.body;
  
  const validationResult = validateRequestData(blobName, base64content);
  if (validationResult) {
    return sendBadRequest(context, validationResult);
  }

  const content = atob(base64content);

  const sharedKeyCredential = new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
  const blobServiceClient = new BlobServiceClient(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`, sharedKeyCredential);
  const containerClient = blobServiceClient.getContainerClient(STORAGE_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const uploadBlobResponse = await blockBlobClient.upload(content, content.length);
    console.log(`Uploaded block blob ${blobName} successfully. Request ID: ${uploadBlobResponse.requestId}`);
    return sendResponse(context, 200, "Blob uploaded successfully.");
  } catch (error) {
    console.error("Error uploading blob:", error);
    return sendResponse(context, 500, "Internal Server Error");
  }
};

function validateRequestData(blobName, base64content) {
  if (!blobName || blobName === "") {
    return "Missing blobName in the request body.";
  }

  if (!base64content || base64content === "") {
    return "Missing base64content in the request body.";
  }

  return null; // Validation passed
}

function sendBadRequest(context, message) {
  context.res = {
    status: 400,
    body: message
  };
}

function sendResponse(context, status, message) {
  context.res = {
    status: status,
    body: message
  };
}
