import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getGridSizes, getNumberOfPuzzles } from '../../services/puzzleService';

interface PuzzleMenuProps {
   onPuzzleSelected: (level: number) => void;
}

const PuzzleMenu = ({ onPuzzleSelected }: PuzzleMenuProps) => {
   const imageSize = Dimensions.get('window').width * 0.1;
   const [groups, setGroups] = useState<{ gridSize: number; levels: number[] }[]>([]);

   useEffect(() => {
      const loadGroups = async () => {
         const gridSizes = await getGridSizes();

         let levelOffset = 1;
         const loadedGroups = [];
         for (const gridSize of gridSizes) {
            const count = await getNumberOfPuzzles(gridSize);
            const levels = Array.from({ length: count }, (_, i) => levelOffset + i);
            levelOffset += count;
            loadedGroups.push({ gridSize, levels });
         }

         setGroups(loadedGroups);
      };

      loadGroups();
   }, []);

   return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
         {groups.map(({ gridSize, levels }) => (
            <View key={gridSize} style={styles.group}>
               <Text style={styles.groupTitle}>{gridSize}{'\u00d7'}{gridSize}</Text>
               <View style={styles.row}>
                  {levels.map((level) => (
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
                           <Text style={{ fontSize: 28, color: '#999' }}>?</Text>
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

export default PuzzleMenu;