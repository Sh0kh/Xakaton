import ReactLoading from 'react-loading';

export default function Loading() {
    return (
        <div className="flex items-center justify-center h-[600px]">
            <ReactLoading type="spinningBubbles" color="#1976d2" height={80} width={80} />
        </div>
    );
}
