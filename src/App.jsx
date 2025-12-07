import React from 'react';

// Renamed import to match the new component name
import Weather from './assets/components/Weather'; 

function App(){

    // The main application wrapper with the weather component
    return(
        <div className="app-container">
            <Weather/>
        </div>
    );

}

export default App;