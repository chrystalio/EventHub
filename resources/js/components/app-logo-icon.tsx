import { SVGAttributes } from 'react';

// export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
//     return (
//         <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
//             <path
//                 fillRule="evenodd"
//                 clipRule="evenodd"
//                 d="M17.2 5.63325L8.6 0.855469L0 5.63325V32.1434L16.2 41.1434L32.4 32.1434V23.699L40 19.4767V9.85547L31.4 5.07769L22.8 9.85547V18.2999L17.2 21.411V5.63325ZM38 18.2999L32.4 21.411V15.2545L38 12.1434V18.2999ZM36.9409 10.4439L31.4 13.5221L25.8591 10.4439L31.4 7.36561L36.9409 10.4439ZM24.8 18.2999V12.1434L30.4 15.2545V21.411L24.8 18.2999ZM23.8 20.0323L29.3409 23.1105L16.2 30.411L10.6591 27.3328L23.8 20.0323ZM7.6 27.9212L15.2 32.1434V38.2999L2 30.9666V7.92116L7.6 11.0323V27.9212ZM8.6 9.29991L3.05913 6.22165L8.6 3.14339L14.1409 6.22165L8.6 9.29991ZM30.4 24.8101L17.2 32.1434V38.2999L30.4 30.9666V24.8101ZM9.6 11.0323L15.2 7.92117V22.5221L9.6 25.6333V11.0323Z"
//             />
//         </svg>
//     );
// }

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (

        <svg id="emoji" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" {...props}>
            <g id="line">
                <path fill="none" stroke="#ffffff" stroke-miterlimit="10" stroke-width="5"
                      d="M48.1546,23.505 c-3.4279-3.5522-4.0284-8.7836-1.8682-12.9334l-3.6009-3.7315L6.3276,41.9262l3.8016,3.9394 c4.0722-1.5735,8.8681-0.6711,12.09,2.6676s3.9531,8.1636,2.2356,12.1773l3.8016,3.9394l36.3579-35.0861l-3.6009-3.7315 C56.7892,27.8434,51.5825,27.0572,48.1546,23.505z" />
                <ellipse cx="37.1223" cy="22.122" rx="2" ry="2"
                         transform="matrix(0.7098 -0.7044 0.7044 0.7098 -4.8096 32.5704)" fill="#ffffff"
                         stroke="none" />
                <ellipse cx="43.6116" cy="28.6606" rx="2" ry="2"
                         transform="matrix(0.7098 -0.7044 0.7044 0.7098 -7.5322 39.0393)" fill="#ffffff"
                         stroke="none" />
                <ellipse cx="50.101" cy="35.1992" rx="2" ry="2"
                         transform="matrix(0.7098 -0.7044 0.7044 0.7098 -10.2548 45.5083)" fill="#ffffff"
                         stroke="none" />
            </g>
        </svg>

    )
}
