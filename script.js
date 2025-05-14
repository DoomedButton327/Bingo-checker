let bingoCards = [];
let calledNumbers = [];
let isFullHouse = true;

// Add a manually filled Bingo card
document.getElementById('add-card-button').addEventListener('click', () => {
    const cardIndex = bingoCards.length + 1;
    bingoCards.push({ id: cardIndex, numbers: Array(25).fill('') });

    const bingoContainer = document.getElementById('bingo-container');
    const cardElement = createCardElement(cardIndex);
    bingoContainer.appendChild(cardElement);
});

// Add a scanned Bingo card
document.getElementById('scan-card-button').addEventListener('click', async () => {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    try {
        // Access the rear camera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
video.style.Width = '100%' ;
video.style.height = 'auto' ;
        video.srcObject = stream;
        video.hidden = false;

        // Capture an image after 3 seconds for testing purposes
        setTimeout(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Stop the camera
            video.srcObject.getTracks().forEach(track => track.stop());
            video.hidden = true;
            // Perform OCR on the captured image
            Tesseract.recognize(canvas, 'eng', { logger: (m) => console.log(m) })
                .then(({ data: { text } }) => {
                    const numbers = parseNumbersFromText(text);

                    if (numbers.length === 25) {
                        const cardIndex = bingoCards.length + 1;
                        bingoCards.push({ id: cardIndex, numbers });

                        const bingoContainer = document.getElementById('bingo-container');
                        const cardElement = createCardElement(cardIndex, numbers);
                        bingoContainer.appendChild(cardElement);
                    } else {
                        alert('Failed to recognize a complete Bingo card. Ensure the card is fully visible and try again.');
                    }
                })
                .catch(error => {
                    console.error('OCR Error:', error);
                    alert('Failed to process the image. Please try again.');
                });
        }, 3000); // Capture after 3 seconds
    } catch (error) {
        console.error('Camera Error:', error);
        alert('Unable to access the camera. Please ensure camera permissions are enabled.');
    }
});

// Toggle game mode between Full House and One Row
document.getElementById('toggle-mode-button').addEventListener('click', () => {
    isFullHouse = !isFullHouse;
    document.getElementById('game-mode').textContent = `Current Mode: ${isFullHouse ? "Full House" : "One Row"}`;
});

// Call a number
document.getElementById('call-number-button').addEventListener('click', () => {
    const numberInput = document.getElementById('number-input');
    const number = parseInt(numberInput.value, 10);

    if (!isNaN(number) && !calledNumbers.includes(number)) {
        calledNumbers.push(number);

        const calledNumbersList = document.getElementById('called-numbers-list');
        const listItem = document.createElement('li');
        listItem.textContent = number;
        calledNumbersList.appendChild(listItem);

        checkForWinners();
    }

    numberInput.value = '';
});

// Reset the game
document.getElementById('reset-button').addEventListener('click', () => {
    bingoCards = [];
    calledNumbers = [];
    document.getElementById('bingo-container').innerHTML = '';
    document.getElementById('called-numbers-list').innerHTML = '';
    document.getElementById('results-list').innerHTML = '';
});

// Create a Bingo card element
function createCardElement(cardIndex, numbers = Array(25).fill('')) {
    const cardElement = document.createElement('div');
    cardElement.className = 'bingo-card';
    cardElement.dataset.cardId = cardIndex;

    numbers.forEach((number, i) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = number || '';
        input.placeholder = '0';
        input.addEventListener('input', (e) => {
            bingoCards[cardIndex - 1].numbers[i] = parseInt(e.target.value, 10) || 0;
        });
        cardElement.appendChild(input);
    });

    return cardElement;
}

// Check for winning cards
function checkForWinners() {
    bingoCards.forEach((card, index) => {
        const numbers = card.numbers;
        const isWinner = isFullHouse
            ? numbers.every(num => calledNumbers.includes(num))
            : checkOneRowWin(numbers);

        if (isWinner) {
            const resultsList = document.getElementById('results-list');
            const listItem = document.createElement('li');
            listItem.textContent = `Bingo Card ${card.id} wins!`;
            resultsList.appendChild(listItem);

            // Remove card from active play to prevent repeated notifications
            bingoCards[index].isWinner = true;
        }
    });
}

// Check if a card has a one-row win
function checkOneRowWin(numbers) {
    const rows = [
        numbers.slice(0, 5),
        numbers.slice(5, 10),
        numbers.slice(10, 15),
        numbers.slice(15, 20),
        numbers.slice(20, 25)
    ];

    const columns = [
        [numbers[0], numbers[5], numbers[10], numbers[15], numbers[20]],
        [numbers[1], numbers[6], numbers[11], numbers[16], numbers[21]],
        [numbers[2], numbers[7], numbers[12], numbers[17], numbers[22]],
        [numbers[3], numbers[8], numbers[13], numbers[18], numbers[23]],
        [numbers[4], numbers[9], numbers[14], numbers[19], numbers[24]]
    ];

    const diagonals = [
        [numbers[0], numbers[6], numbers[12], numbers[18], numbers[24]],
        [numbers[4], numbers[8], numbers[12], numbers[16], numbers[20]]
    ];

    const allLines = [...rows, ...columns, ...diagonals];

    return allLines.some(line => line.every(num => calledNumbers.includes(num)));
}

// Parse numbers from OCR text
function parseNumbersFromText(text) {
    const numbers = text.match(/\d+/g);
    return numbers ? numbers.map(Number).slice(0, 25) : [];
}
document.addEventListener("DOMContentLoaded", function() {
    // File upload functionality
    document.getElementById("upload-card").addEventListener("click", () => {
        // Trigger file input when the button is clicked
        document.getElementById("file-input").click();
    });

    document.getElementById("file-input").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log("File selected:", file); // Debugging line to check if file is selected

            const reader = new FileReader();
            reader.onload = async function (e) {
                const imageUrl = e.target.result;

                // Debugging: check if the image is loaded correctly
                console.log("Image URL loaded:", imageUrl);

                // Create an image element and set the source to the uploaded file
                const img = new Image();
                img.src = imageUrl;
                img.onload = async function () {
                    console.log("Image loaded for OCR processing");

                    // Use Tesseract.js to recognize text from the uploaded image
                    try {
                        const { data: { text } } = await Tesseract.recognize(img, "eng");
                        console.log("Tesseract result:", text); // Check OCR output

                        const numbers = parseBingoCard(text);
                        
                        if (numbers) {
                            console.log("Bingo numbers recognized:", numbers); // Check if bingo numbers are correctly parsed
                           addBingoCard(numbers);
                        } else {
                            alert("Failed to recognize a complete Bingo card. Ensure the card is fully visible and try again.");
                        }
                    } catch (error) {
                        console.error("Error processing the image:", error);
                    }
                };
            };
            reader.readAsDataURL(file); // Read the image as a DataURL
        }
    });

    // Add Bingo card to the page
    function addBingoCard(numbers) {
        const cardContainer = document.getElementById("bingo-cards");
        const card = document.createElement("div");
        card.classList.add("bingo-card");

        numbers.forEach(number => {
            const numberDiv = document.createElement("div");
            numberDiv.classList.add("number");
            numberDiv.innerText = number;
            card.appendChild(numberDiv);
        });

        cardContainer.appendChild(card);
    }

    // Parse recognized text into Bingo card numbers
    function parseBingoCard(text) {
        // Simple parsing: assumes the numbers are listed in a grid
        const regex = /\d+/g;
        const numbers = text.match(regex);
        if (numbers && numbers.length === 25) { // Standard 5x5 Bingo card
            return numbers.map(Number);
        }
        return null;
    }

    // Reset functionality (optional)
    document.getElementById("reset").addEventListener("click", () => {
        document.getElementById("bingo-cards").innerHTML = "";
    });
});