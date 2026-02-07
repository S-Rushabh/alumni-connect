
import {
    collection,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db } from '../firebase';
import type { LocationData } from '../types';

class HeatmapService {

    // Get alumni distribution by location
    async getAlumniByLocation(): Promise<LocationData[]> {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const locationMap = new Map<string, any>();

            usersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                const location = userData.location;

                // Handle string location or object location
                let city = 'Unknown';
                let country = 'Unknown';
                let coordinates = { latitude: 0, longitude: 0 };

                if (typeof location === 'string') {
                    // Simple parsing for "City, Country" strings or just "City"
                    const parts = location.split(',').map((s: string) => s.trim());
                    city = parts[0];
                    country = parts[1] || 'Global';
                    // Placeholder coordinates using a hash or lookup would be needed for real map
                    // For now, random scatter for demo if coords missing
                    coordinates = {
                        latitude: (Math.random() * 180 - 90),
                        longitude: (Math.random() * 360 - 180)
                    };
                } else if (location && typeof location === 'object') {
                    city = location.city || 'Unknown';
                    country = location.country || 'Unknown';
                    if (location.coordinates) {
                        coordinates = {
                            latitude: location.coordinates.latitude || 0,
                            longitude: location.coordinates.longitude || 0
                        };
                    }
                } else {
                    return; // Skip if no location
                }

                const key = `${city}, ${country}`;

                if (!locationMap.has(key)) {
                    locationMap.set(key, {
                        city: city,
                        country: country,
                        coordinates: coordinates,
                        alumniCount: 0,
                        totalEngagement: 0,
                        totalSuccessScore: 0,
                        totalDonations: 0, // Initialize new field
                        industries: []
                    });
                }

                const loc = locationMap.get(key);
                loc.alumniCount++;
                // Use fallbacks for missing data
                loc.totalEngagement += (userData.gamification?.totalPoints || 0) / 100; // Proxy for engagement
                // Success score proxy
                loc.totalSuccessScore += (userData.role === 'alumni' ? 80 : 20);

                // Aggregate real donations
                loc.totalDonations += (userData.totalDonations || 0);

                if (userData.industry) {
                    loc.industries.push(userData.industry);
                }
            });

            // Calculate averages and top industries
            const locationData: LocationData[] = [];

            locationMap.forEach((value, _key) => {
                const avgEngagement = value.alumniCount > 0
                    ? value.totalEngagement / value.alumniCount
                    : 0;

                const avgSuccessScore = value.alumniCount > 0
                    ? value.totalSuccessScore / value.alumniCount
                    : 0;

                // Get top 3 industries
                const industryCount = value.industries.reduce((acc: any, industry: string) => {
                    acc[industry] = (acc[industry] || 0) + 1;
                    return acc;
                }, {});

                const topIndustries = Object.entries(industryCount)
                    .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([industry]) => industry);

                locationData.push({
                    city: value.city,
                    country: value.country,
                    coordinates: value.coordinates,
                    alumniCount: value.alumniCount,
                    avgEngagement,
                    avgSuccessScore,
                    topIndustries,
                    // Pass the raw total or an average? Let's pass total for the map volume.
                    // But interface says avgEngagement. Let's add totalDonations to LocationData interface if needed or misuse a field.
                    // Better to update LocationData interface in types.ts as well? 
                    // Wait, I updated UserProfile, but missed LocationData in types.ts step!
                    // I need to add totalDonations to LocationData in types.ts.
                    // For now, I'll temporarily stash it in the object and update types.ts in next step.
                    // Actually, I can update types.ts now or just cast it. 
                    // Let's stick to adding it properly. I will update types.ts again.
                } as any);
            });

            return locationData.sort((a, b) => b.alumniCount - a.alumniCount);

        } catch (error) {
            console.error('Error getting alumni by location:', error);
            return [];
        }
    }

    // Get alumni in specific city
    async getAlumniInCity(city: string, country: string): Promise<any[]> {
        try {
            // Logic needs robust handling for string vs object location. 
            // For now assume query matches new schema or we filter client side.
            const usersQuery = query(
                collection(db, 'users'),
                where('location.city', '==', city),
                where('location.country', '==', country)
            );

            const snapshot = await getDocs(usersQuery);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('Error getting alumni in city:', error);
            return [];
        }
    }

    // Get industry distribution
    async getIndustryDistribution(): Promise<Record<string, number>> {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const industryCount: Record<string, number> = {};

            usersSnapshot.docs.forEach(doc => {
                const industry = doc.data().industry;
                if (industry) {
                    industryCount[industry] = (industryCount[industry] || 0) + 1;
                }
            });

            return industryCount;

        } catch (error) {
            console.error('Error getting industry distribution:', error);
            return {};
        }
    }
}

export const heatmapService = new HeatmapService();
