import { useState } from 'react';

export interface WebsiteVersion {
  id: string;
  content: string;
  timestamp: Date;
  versionNumber: number;
}

export const useVersionHistory = () => {
  const [websiteVersions, setWebsiteVersions] = useState<WebsiteVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string>('');

  const createNewVersion = (content: string): WebsiteVersion => {
    const newVersion: WebsiteVersion = {
      id: `version-${Date.now()}`,
      content,
      timestamp: new Date(),
      versionNumber: websiteVersions.length + 1
    };
    
    setWebsiteVersions(prev => [...prev, newVersion]);
    setCurrentVersionId(newVersion.id);
    
    return newVersion;
  };

  const restoreVersion = (versionId: string) => {
    const version = websiteVersions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersionId(versionId);
      return version;
    }
    return null;
  };

  const resetVersions = () => {
    setWebsiteVersions([]);
    setCurrentVersionId('');
  };

  return {
    websiteVersions,
    currentVersionId,
    createNewVersion,
    restoreVersion,
    resetVersions
  };
};
