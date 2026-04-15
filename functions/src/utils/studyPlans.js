function getPublishedStudyPlanError(planDoc, action) {
  if (!planDoc.exists) {
    return {
      statusCode: 404,
      error: "Study plan not found",
    };
  }

  if (planDoc.data().status !== "published") {
    return {
      statusCode: 403,
      error: `Only published study plans can be ${action}`,
    };
  }

  return null;
}

module.exports = {
  getPublishedStudyPlanError,
};
