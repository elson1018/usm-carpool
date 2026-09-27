import {
  createContext,
  useContext,
  useState,
} from 'react';

const RideDraftContext = createContext(null);

export function RideDraftProvider({
  children,
}) {
  const [origin, setOrigin] = useState('');
  const [originLatitude, setOriginLatitude] =
    useState(null);
  const [originLongitude, setOriginLongitude] =
    useState(null);

  const [destination, setDestination] =
    useState('');
  const [
    destinationLatitude,
    setDestinationLatitude,
  ] = useState(null);
  const [
    destinationLongitude,
    setDestinationLongitude,
  ] = useState(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  function clearRideDraft() {
    setOrigin('');
    setOriginLatitude(null);
    setOriginLongitude(null);

    setDestination('');
    setDestinationLatitude(null);
    setDestinationLongitude(null);

    setDate('');
    setTime('');
  }

  return (
    <RideDraftContext.Provider
      value={{
        origin,
        setOrigin,

        originLatitude,
        setOriginLatitude,

        originLongitude,
        setOriginLongitude,

        destination,
        setDestination,

        destinationLatitude,
        setDestinationLatitude,

        destinationLongitude,
        setDestinationLongitude,

        date,
        setDate,

        time,
        setTime,

        clearRideDraft,
      }}
    >
      {children}
    </RideDraftContext.Provider>
  );
}

export function useRideDraft() {
  const context =
    useContext(RideDraftContext);

  if (!context) {
    throw new Error(
      'useRideDraft must be used inside RideDraftProvider'
    );
  }

  return context;
}