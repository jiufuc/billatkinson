// export_to_json.mjs
import fs from 'fs/promises';

async function convertToJson(inputPath, outputPath) {
    try {
        // Read the input file
        const content = await fs.readFile(inputPath, 'utf8');
        
        // Split into lines and remove empty lines
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Convert each line to the desired object structure
        const jsonData = lines.map(line => {
            const fields = line.split(':');
            
            // Ensure we have enough fields and handle missing ones gracefully
            return {
                photo_id: parseInt(fields[0]),                    // 1st field as integer
                photo_title: fields[1] || '',                    // 2nd field as string
                photo_collection: fields[2] || '',              // 3rd field as string
                photo_location: fields[3] || '',                // 4th field as string
                photo_year: parseInt(fields[4]) || null,        // 5th field as integer (null if not a number)
                film_format: fields[5] || '',                   // 6th field as string
                camera: fields[6] || '',                        // 7th field as string
                film_stock: fields[7] || '',                    // 8th field as string
                photo_tags: fields[8] ? fields[8].split(',') : []  // 9th field as array (empty if not present)
            };
        });

        // Write to JSON file with pretty printing
        await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`File converted to JSON successfully. Output written to ${outputPath}`);

    } catch (error) {
        console.error('Error converting to JSON:', error);
    }
}

// Example usage
const inputFile = 'UpdatedOutput.txt';
const outputFile = 'photos.json';

await convertToJson(inputFile, outputFile);