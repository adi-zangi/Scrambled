/**
 * Level select screen. Groups puzzles by grid size and shows them as a
 * tappable grid, revealing thumbnails for solved puzzles.
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, PixelRatio } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { getAllPuzzles, getAllPuzzlesSolvedForDevice, resetAllPuzzleProgress } from '@/services/puzzleService';
import { ICON_SIZES, buildThumbnailUrl } from '@/src/constants/thumbnails';
import { Image } from 'expo-image';
import { showAlert } from '../utils/alert';
import { setResumeLevel } from '@/services/resumeLevelService';

interface LevelMenuProps {
   deviceId: string;
   onPuzzleSelected: (level: number) => void;
}

interface Level {
   level: number;
   imageUrl: string;
   solved: boolean;
}

interface Group {
   gridSize: number;
   puzzles: Level[];
}

const LevelMenu = ({ deviceId, onPuzzleSelected }: LevelMenuProps) => {
   const imageSize = Dimensions.get('window').width * 0.1;
   const thumbnailSize = PixelRatio.get() >= 2 ? ICON_SIZES[1] : ICON_SIZES[0];
   const [groups, setGroups] = useState<Group[]>([]);

   /**
    * Fetches all puzzles and their solved status for this device, then groups
    * the puzzles by grid size.
    */
   const loadGroups = useCallback(async () => {
      const [puzzles, progress] = await Promise.all([
         getAllPuzzles(),
         getAllPuzzlesSolvedForDevice(deviceId),
      ]);

      const solvedPuzzleIds = new Set(
         progress.filter((row) => row.solved).map((row) => row.puzzle_id)
      );

      const groupsByGridSize = new Map<number, Level[]>();
      for (const puzzle of puzzles) {
         const Level: Level = {
            level: puzzle.level_number,
            imageUrl: buildThumbnailUrl(puzzle.image_url, thumbnailSize),
            solved: solvedPuzzleIds.has(puzzle.id),
         };
         const existing = groupsByGridSize.get(puzzle.grid_size) ?? [];
         existing.push(Level);
         groupsByGridSize.set(puzzle.grid_size, existing);
      }

      const loadedGroups = Array.from(groupsByGridSize.entries())
         .sort(([gridSizeA], [gridSizeB]) => gridSizeA - gridSizeB)
         .map(([gridSize, groupPuzzles]) => ({ gridSize, puzzles: groupPuzzles }));

      setGroups(loadedGroups);
   }, [deviceId, thumbnailSize]);

   useEffect(() => {
      loadGroups();
   }, [loadGroups]);

   /**
    * Resets all puzzle progress for this device, resets the resume level
    * back to 1, sets the current level to 1, then refreshes the thumbnails
    * in the menu. Shows an alert if something fails.
    */
   const handleResetProgress = async () => {
      try {
         await resetAllPuzzleProgress(deviceId);
         await setResumeLevel(1);
         onPuzzleSelected(1);
         await loadGroups();
      } catch (err) {
         console.error('Failed to reset progress:', err);
         showAlert('Something went wrong', 'Could not reset progress');
      }
   };

   return (
      <View style={styles.wrapper}>
         <View style={styles.resetButtonRow}>
            <TouchableOpacity onPress={handleResetProgress} style={styles.resetButton}>
               <Text style={styles.resetButtonText}>Reset All Puzzles</Text>
            </TouchableOpacity>
         </View>
         <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {groups.map(({ gridSize, puzzles }) => (
               <View key={gridSize} style={styles.group}>
                  <Text style={styles.groupTitle}>{gridSize}{'\u00d7'}{gridSize}</Text>
                  <View style={styles.row}>
                     {puzzles.map(({ level, imageUrl, solved }) => (
                        <TouchableOpacity
                           key={level}
                           onPress={() => onPuzzleSelected(level)}
                           style={styles.imageWrapper}
                           accessibilityLabel={`Level ${level}`}
                        >
                           <View style={{
                              width: imageSize,
                              height: imageSize,
                              backgroundColor: '#e0e0e0',
                              alignItems: 'center',
                              justifyContent: 'center',
                           }}>
                              {solved ? (
                                 <Image
                                    source={{ uri: imageUrl }}
                                    cachePolicy="disk"
                                    style={{ width: imageSize, height: imageSize }}
                                 />
                              ) : (
                                 <Text style={{ fontSize: 28, color: '#999' }}>?</Text>
                              )}
                           </View>
                        </TouchableOpacity>
                     ))}
                  </View>
               </View>
            ))}
         </ScrollView>
      </View>
   );
};

const styles = StyleSheet.create({
   wrapper: {
      flex: 1,
      backgroundColor: 'white',
   },
   container: {
      backgroundColor: 'white',
      flex: 1,
   },
   content: {
      padding: 16,
   },
   group: {
      marginBottom: 24,
   },
   groupTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#333',
   },
   row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
   },
   imageWrapper: {
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: '#ddd',
   },
   resetButtonRow: {
      width: '100%',
      alignItems: 'flex-end',
      backgroundColor: 'white',
      paddingVertical: 8,
      paddingHorizontal: 16,
   },
   resetButton: {
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 12,
   },
   resetButtonText: {
      color: '#000',
      fontWeight: '400',
   },
});

export default LevelMenu;