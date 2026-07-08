import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAllPuzzles, getAllPuzzleProgressForDevice } from '@/services/puzzleService';

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
   const [groups, setGroups] = useState<Group[]>([]);

   useEffect(() => {
      const loadGroups = async () => {
         const [puzzles, progress] = await Promise.all([
            getAllPuzzles(),
            getAllPuzzleProgressForDevice(deviceId),
         ]);

         const solvedPuzzleIds = new Set(
            progress.filter((row) => row.solved).map((row) => row.puzzle_id)
         );

         const groupsByGridSize = new Map<number, Level[]>();
         for (const puzzle of puzzles) {
            const Level: Level = {
               level: puzzle.level_number,
               imageUrl: puzzle.image_url,
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
      };

      loadGroups();
   }, [deviceId]);

   return (
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
   );
};

const styles = StyleSheet.create({
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
});

export default LevelMenu;