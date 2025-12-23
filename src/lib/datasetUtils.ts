
// Helper function to get the latest approved version
export const getLatestApprovedVersion = (versions: any[]) => {
    if (!versions || versions.length === 0) return null;

    const approvedVersions = versions
        .filter(version => version.approved === true)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return approvedVersions.length > 0 ? approvedVersions[0] : null;
};