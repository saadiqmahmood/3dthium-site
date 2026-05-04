const PrivacyPage = () => (
  <div className="max-w-3xl mx-auto py-8 pt-32 px-4">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Notice</h1>
    <p className="text-sm text-gray-500 mb-8 font-semibold">Last updated July 07, 2025</p>

    <section className="mb-8">
      <p className="text-base text-gray-700 mb-4">
        This Privacy Notice for <span className="font-semibold">3Dthium</span> (&quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) describes how and why we might access, collect, store,
        use, and/or share (&quot;process&quot;) your personal information when you use our services
        (&quot;Services&quot;), including when you:
      </p>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>
          Visit our website at{' '}
          <a
            href="https://www.3dthium.co.uk"
            className="text-blue-600 underline hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.3dthium.co.uk
          </a>{' '}
          or any website of ours that links to this Privacy Notice
        </li>
        <li>
          Use 3D printing and design services. 3Dthium is a creative studio specialising in 3D
          printing, design, and custom products. We offer a wide range of high-quality 3D printed
          items and a custom order system for tailor-made creations.
        </li>
        <li>Engage with us in other related ways, including any sales, marketing, or events</li>
      </ul>
      <p className="text-base text-gray-700 mb-4">
        <span className="font-semibold">Questions or concerns?</span> Reading this Privacy Notice
        will help you understand your privacy rights and choices. If you do not agree with our
        policies and practices, please do not use our Services. If you still have any questions or
        concerns, please contact us at{' '}
        <a href="mailto:info@3dthium.co.uk" className="text-blue-600 underline hover:text-blue-800">
          info@3dthium.co.uk
        </a>
        .
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Summary of Key Points</h2>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>
          We may process personal information depending on how you interact with us and the
          Services, the choices you make, and the products and features you use.{' '}
          <a href="#personalinfo" className="text-blue-600 underline hover:text-blue-800">
            Learn more
          </a>
          .
        </li>
        <li>We do not process sensitive personal information.</li>
        <li>We do not collect any information from third parties.</li>
        <li>
          We process your information to provide, improve, and administer our Services, communicate
          with you, for security and fraud prevention, and to comply with law.{' '}
          <a href="#infouse" className="text-blue-600 underline hover:text-blue-800">
            Learn more
          </a>
          .
        </li>
        <li>
          We may share information in specific situations and with specific third parties.{' '}
          <a href="#whoshare" className="text-blue-600 underline hover:text-blue-800">
            Learn more
          </a>
          .
        </li>
        <li>
          We have organisational and technical processes and procedures in place to protect your
          personal information.{' '}
          <a href="#infosafe" className="text-blue-600 underline hover:text-blue-800">
            Learn more
          </a>
          .
        </li>
        <li>
          Depending on where you are located, you may have certain rights regarding your personal
          information.{' '}
          <a href="#privacyrights" className="text-blue-600 underline hover:text-blue-800">
            Learn more
          </a>
          .
        </li>
        <li>
          You can exercise your rights by visiting{' '}
          <a
            href="https://app.termly.io/notify/dbe89344-a7b0-499f-bc97-2d188aeb4667"
            className="text-blue-600 underline hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            this page
          </a>{' '}
          or by contacting us.
        </li>
      </ul>
      <p className="text-base text-gray-700">
        Want to learn more about what we do with any information we collect?{' '}
        <a href="#toc" className="text-blue-600 underline hover:text-blue-800">
          Review the Privacy Notice in full
        </a>
        .
      </p>
    </section>

    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="toc">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Table of Contents</h2>
      <ul className="list-disc pl-6 text-base text-blue-700">
        <li>
          <a href="#infocollect" className="hover:underline">
            1. What information do we collect?
          </a>
        </li>
        <li>
          <a href="#infouse" className="hover:underline">
            2. How do we process your information?
          </a>
        </li>
        <li>
          <a href="#legalbases" className="hover:underline">
            3. What legal bases do we rely on to process your personal information?
          </a>
        </li>
        <li>
          <a href="#whoshare" className="hover:underline">
            4. When and with whom do we share your personal information?
          </a>
        </li>
        <li>
          <a href="#cookies" className="hover:underline">
            5. Do we use cookies and other tracking technologies?
          </a>
        </li>
        <li>
          <a href="#ai" className="hover:underline">
            6. Do we offer artificial intelligence-based products?
          </a>
        </li>
        <li>
          <a href="#sociallogins" className="hover:underline">
            7. How do we handle your social logins?
          </a>
        </li>
        <li>
          <a href="#inforetain" className="hover:underline">
            8. How long do we keep your information?
          </a>
        </li>
        <li>
          <a href="#infosafe" className="hover:underline">
            9. How do we keep your information safe?
          </a>
        </li>
        <li>
          <a href="#privacyrights" className="hover:underline">
            10. What are your privacy rights?
          </a>
        </li>
        <li>
          <a href="#DNT" className="hover:underline">
            11. Controls for do-not-track features
          </a>
        </li>
        <li>
          <a href="#policyupdates" className="hover:underline">
            12. Do we make updates to this notice?
          </a>
        </li>
        <li>
          <a href="#contact" className="hover:underline">
            13. How can you contact us about this notice?
          </a>
        </li>
        <li>
          <a href="#request" className="hover:underline">
            14. How can you review, update, or delete the data we collect from you?
          </a>
        </li>
      </ul>
    </section>

    {/* --- Section 1 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="infocollect">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        1. What information do we collect?
      </h2>
      {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2" id="personalinfo">
        Personal information you disclose to us
      </h3>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We collect personal information that you
        provide to us.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We collect personal information that you voluntarily provide to us when you register on the
        Services, express an interest in obtaining information about us or our products and
        Services, participate in activities on the Services, or otherwise contact us.
      </p>
      <p className="text-base text-gray-700 mb-2">
        The personal information we collect may include the following:
      </p>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>Names</li>
        <li>Phone numbers</li>
        <li>Email addresses</li>
        <li>Mailing addresses</li>
        <li>Passwords</li>
        <li>Contact preferences</li>
        <li>Contact or authentication data</li>
        <li>Billing addresses</li>
      </ul>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">Sensitive Information:</span> We do not process sensitive
        information.
      </p>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">Payment Data:</span> We may collect data necessary to
        process your payment if you choose to make purchases, such as your payment instrument number
        and the security code associated with your payment instrument. All payment data is handled
        and stored by{' '}
        <a
          href="https://stripe.com/gb/privacy"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe
        </a>
        .
      </p>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">Social Media Login Data:</span> We may provide you with the
        option to register with us using your existing social media account details. If you choose
        to register in this way, we will collect certain profile information about you from the
        social media provider, as described in the section{' '}
        <a href="#sociallogins" className="text-blue-600 underline hover:text-blue-800">
          How do we handle your social logins?
        </a>{' '}
        below.
      </p>
      <p className="text-base text-gray-700 mb-2">
        All personal information that you provide to us must be true, complete, and accurate, and
        you must notify us of any changes to such personal information.
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Information automatically collected
      </h3>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> Some information — such as your Internet
        Protocol (IP) address and/or browser and device characteristics — is collected automatically
        when you visit our Services.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We automatically collect certain information when you visit, use, or navigate the Services.
        This information does not reveal your specific identity (like your name or contact
        information) but may include device and usage information, such as your IP address, browser
        and device characteristics, operating system, language preferences, referring URLs, device
        name, country, location, information about how and when you use our Services, and other
        technical information. This information is primarily needed to maintain the security and
        operation of our Services, and for our internal analytics and reporting purposes.
      </p>
      <p className="text-base text-gray-700 mb-2">
        Like many businesses, we also collect information through cookies and similar technologies.
        You can find out more about this in our Cookie Notice:{' '}
        <a
          href="https://www.3dthium.co.uk/cookies"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.3dthium.co.uk/cookies
        </a>
        .
      </p>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>
          <span className="font-semibold">Log and Usage Data:</span> Service-related, diagnostic,
          usage, and performance information our servers automatically collect when you access or
          use our Services and which we record in log files.
        </li>
        <li>
          <span className="font-semibold">Device Data:</span> Information about your computer,
          phone, tablet, or other device you use to access the Services.
        </li>
        <li>
          <span className="font-semibold">Location Data:</span> Information about your device&apos;s
          location, which can be either precise or imprecise.
        </li>
      </ul>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Google API</h3>
      <p className="text-base text-gray-700 mb-2">
        Our use of information received from Google APIs will adhere to the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy#limited-use"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Limited Use requirements
        </a>
        .
      </p>
    </section>

    {/* --- Section 2 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="infouse">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        2. How do we process your information?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We process your information to provide,
        improve, and administer our Services, communicate with you, for security and fraud
        prevention, and to comply with law. We may also process your information for other purposes
        with your consent.
      </p>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>
          To facilitate account creation and authentication and otherwise manage user accounts
        </li>
        <li>To deliver and facilitate delivery of services to the user</li>
        <li>To respond to user inquiries/offer support to users</li>
        <li>To send administrative information to you</li>
        <li>To fulfil and manage your orders, payments, returns, and exchanges</li>
        <li>To request feedback</li>
        <li>
          To send you marketing and promotional communications (in accordance with your preferences)
        </li>
        <li>To deliver targeted advertising to you</li>
        <li>To protect our Services (including fraud monitoring and prevention)</li>
        <li>To identify usage trends</li>
        <li>To determine the effectiveness of our marketing and promotional campaigns</li>
        <li>To save or protect an individual&apos;s vital interest, such as to prevent harm</li>
      </ul>
    </section>

    {/* --- Section 3 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="legalbases">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        3. What legal bases do we rely on to process your personal information?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We only process your personal information
        when we believe it is necessary and we have a valid legal reason (i.e. legal basis) to do so
        under applicable law, like with your consent, to comply with laws, to provide you with
        services to enter into or fulfil our contractual obligations, to protect your rights, or to
        fulfil our legitimate business interests.
      </p>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>
          <span className="font-semibold">Consent:</span> We may process your information if you
          have given us permission to use your personal information for a specific purpose. You can
          withdraw your consent at any time.{' '}
          <a href="#withdrawconsent" className="text-blue-600 underline hover:text-blue-800">
            Learn more
          </a>
          .
        </li>
        <li>
          <span className="font-semibold">Performance of a Contract:</span> We may process your
          personal information when we believe it is necessary to fulfil our contractual obligations
          to you.
        </li>
        <li>
          <span className="font-semibold">Legal Obligations:</span> We may process your information
          where we believe it is necessary for compliance with our legal obligations.
        </li>
        <li>
          <span className="font-semibold">Vital Interests:</span> We may process your information
          where we believe it is necessary to protect your vital interests or the vital interests of
          a third party.
        </li>
        <li>
          <span className="font-semibold">Legitimate Interests:</span> We may process your
          information when we believe it is reasonably necessary to achieve our legitimate business
          interests and those interests do not outweigh your interests and fundamental rights and
          freedoms. For example, we may process your personal information for some of the purposes
          described in order to:
        </li>
      </ul>
    </section>

    {/* --- Section 4 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="whoshare">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        4. When and with whom do we share your personal information?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We may share information in specific
        situations described in this section and/or with the following categories of third parties.
      </p>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>Data Analytics Services</li>
        <li>Data Storage Service Providers</li>
        <li>Payment Processors</li>
        <li>Order Fulfilment Service Providers</li>
        <li>Performance Monitoring Tools</li>
        <li>Sales & Marketing Tools</li>
        <li>Testing Tools</li>
        <li>Website Hosting Service Providers</li>
        <li>Communication & Collaboration Tools</li>
      </ul>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">Business Transfers:</span> We may share or transfer your
        information in connection with, or during negotiations of, any merger, sale of company
        assets, financing, or acquisition of all or a portion of our business to another company.
      </p>
    </section>

    {/* --- Section 5 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="cookies">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        5. Do we use cookies and other tracking technologies?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We may use cookies and other tracking
        technologies to collect and store your information.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We may use cookies and similar tracking technologies (like web beacons and pixels) to gather
        information when you interact with our Services. Some online tracking technologies help us
        maintain the security of our Services and your account, prevent crashes, fix bugs, save your
        preferences, and assist with basic site functions.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We also permit third parties and service providers to use online tracking technologies on
        our Services for analytics and advertising, including to help manage and display
        advertisements, to tailor advertisements to your interests, or to send abandoned shopping
        cart reminders (depending on your communication preferences). The third parties and service
        providers use their technology to provide advertising about products and services tailored
        to your interests which may appear either on our Services or on other websites.
      </p>
      <p className="text-base text-gray-700 mb-2">
        Specific information about how we use such technologies and how you can refuse certain
        cookies is set out in our Cookie Notice:{' '}
        <a
          href="https://www.3dthium.co.uk/cookies"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.3dthium.co.uk/cookies
        </a>
        .
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Google Analytics</h3>
      <p className="text-base text-gray-700 mb-2">
        We may share your information with Google Analytics to track and analyse the use of the
        Services. To opt out of being tracked by Google Analytics across the Services, visit{' '}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://tools.google.com/dlpage/gaoptout
        </a>
        . For more information on the privacy practices of Google, please visit the{' '}
        <a
          href="https://policies.google.com/privacy"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Privacy & Terms page
        </a>
        .
      </p>
    </section>

    {/* --- Section 6 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="ai">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        6. Do we offer artificial intelligence-based products?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We offer products, features, or tools
        powered by artificial intelligence, machine learning, or similar technologies.
      </p>
      <p className="text-base text-gray-700 mb-2">
        As part of our Services, we offer products, features, or tools powered by artificial
        intelligence, machine learning, or similar technologies (collectively, &quot;AI
        Products&quot;). These tools are designed to enhance your experience and provide you with
        innovative solutions. The terms in this Privacy Notice govern your use of the AI Products
        within our Services.
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Our AI Products</h3>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>Natural language processing</li>
        <li>AI automation</li>
        <li>Image analysis</li>
        <li>Image generation</li>
        <li>Machine learning models</li>
        <li>Text analysis</li>
        <li>AI search</li>
        <li>AI bots</li>
      </ul>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        How We Process Your Data Using AI
      </h3>
      <p className="text-base text-gray-700 mb-2">
        All personal information processed using our AI Products is handled in line with our Privacy
        Notice and our agreement with third parties. This ensures high security and safeguards your
        personal information throughout the process.
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">How to Opt Out</h3>
      <p className="text-base text-gray-700 mb-2">
        We believe in giving you the power to decide how your data is used. To opt out, you can
        contact us using the contact information provided below.
      </p>
    </section>

    {/* --- Section 7 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="sociallogins">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        7. How do we handle your social logins?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> If you choose to register or log in to our
        Services using a social media account, we may have access to certain information about you.
      </p>
      <p className="text-base text-gray-700 mb-2">
        Our Services offer you the ability to register and log in using your third-party social
        media account details (like your Facebook or X logins). Where you choose to do this, we will
        receive certain profile information about you from your social media provider. The profile
        information we receive may vary depending on the social media provider concerned, but will
        often include your name, email address, friends list, and profile picture, as well as other
        information you choose to make public on such a social media platform.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We will use the information we receive only for the purposes that are described in this
        Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note
        that we do not control, and are not responsible for, other uses of your personal information
        by your third-party social media provider. We recommend that you review their privacy notice
        to understand how they collect, use, and share your personal information, and how you can
        set your privacy preferences on their sites and apps.
      </p>
    </section>

    {/* --- Section 8 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="inforetain">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        8. How long do we keep your information?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We keep your information for as long as
        necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required
        by law.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We will only keep your personal information for as long as it is necessary for the purposes
        set out in this Privacy Notice, unless a longer retention period is required or permitted by
        law (such as tax, accounting, or other legal requirements). No purpose in this notice will
        require us keeping your personal information for longer than one (1) month past the
        termination of the user&apos;s account.
      </p>
      <p className="text-base text-gray-700 mb-2">
        When we have no ongoing legitimate business need to process your personal information, we
        will either delete or anonymise such information, or, if this is not possible (for example,
        because your personal information has been stored in backup archives), then we will securely
        store your personal information and isolate it from any further processing until deletion is
        possible.
      </p>
    </section>

    {/* --- Section 9 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="infosafe">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        9. How do we keep your information safe?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> We aim to protect your personal information
        through a system of organisational and technical security measures.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We have implemented appropriate and reasonable technical and organisational security
        measures designed to protect the security of any personal information we process. However,
        despite our safeguards and efforts to secure your information, no electronic transmission
        over the Internet or information storage technology can be guaranteed to be 100% secure, so
        we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third
        parties will not be able to defeat our security and improperly collect, access, steal, or
        modify your information. Although we will do our best to protect your personal information,
        transmission of personal information to and from our Services is at your own risk. You
        should only access the Services within a secure environment.
      </p>
    </section>

    {/* --- Section 10 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="privacyrights">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        10. What are your privacy rights?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> In some regions, such as the European
        Economic Area (EEA), United Kingdom (UK), and Switzerland, you have rights that allow you
        greater access to and control over your personal information. You may review, change, or
        terminate your account at any time, depending on your country, province, or state of
        residence.
      </p>
      <p className="text-base text-gray-700 mb-2">
        In some regions (like the EEA, UK, and Switzerland), you have certain rights under
        applicable data protection laws. These may include the right (i) to request access and
        obtain a copy of your personal information, (ii) to request rectification or erasure; (iii)
        to restrict the processing of your personal information; (iv) if applicable, to data
        portability; and (v) not to be subject to automated decision-making. In certain
        circumstances, you may also have the right to object to the processing of your personal
        information. You can make such a request by contacting us by using the contact details
        provided in the section{' '}
        <a href="#contact" className="text-blue-600 underline hover:text-blue-800">
          How can you contact us about this notice?
        </a>{' '}
        below.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We will consider and act upon any request in accordance with applicable data protection
        laws.
      </p>
      <p className="text-base text-gray-700 mb-2">
        If you are located in the EEA or UK and you believe we are unlawfully processing your
        personal information, you also have the right to complain to your{' '}
        <a
          href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Member State data protection authority
        </a>{' '}
        or{' '}
        <a
          href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          UK data protection authority
        </a>
        .
      </p>
      <p className="text-base text-gray-700 mb-2">
        If you are located in Switzerland, you may contact the{' '}
        <a
          href="https://www.edoeb.admin.ch/edoeb/en/home.html"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Federal Data Protection and Information Commissioner
        </a>
        .
      </p>
      {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2" id="withdrawconsent">
        Withdrawing your consent
      </h3>
      <p className="text-base text-gray-700 mb-2">
        If we are relying on your consent to process your personal information, you have the right
        to withdraw your consent at any time. You can withdraw your consent at any time by
        contacting us by using the contact details provided in the section{' '}
        <a href="#contact" className="text-blue-600 underline hover:text-blue-800">
          How can you contact us about this notice?
        </a>{' '}
        below.
      </p>
      <p className="text-base text-gray-700 mb-2">
        However, please note that this will not affect the lawfulness of the processing before its
        withdrawal nor will it affect the processing of your personal information conducted in
        reliance on lawful processing grounds other than consent.
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Opting out of marketing and promotional communications
      </h3>
      <p className="text-base text-gray-700 mb-2">
        You can unsubscribe from our marketing and promotional communications at any time by
        clicking on the unsubscribe link in the emails that we send, replying &apos;STOP&apos; or
        &apos;UNSUBSCRIBE&apos; to the SMS messages that we send, or by contacting us using the
        details provided in the section{' '}
        <a href="#contact" className="text-blue-600 underline hover:text-blue-800">
          How can you contact us about this notice?
        </a>{' '}
        below. You will then be removed from the marketing lists. However, we may still communicate
        with you — for example, to send you service-related messages that are necessary for the
        administration and use of your account, to respond to service requests, or for other
        non-marketing purposes.
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Information</h3>
      <ul className="list-disc pl-6 text-base text-gray-700 mb-4">
        <li>Log in to your account settings and update your user account.</li>
        <li>Contact us using the contact information provided.</li>
      </ul>
      <p className="text-base text-gray-700 mb-2">
        Upon your request to terminate your account, we will deactivate or delete your account and
        information from our active databases. However, we may retain some information in our files
        to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal
        terms and/or comply with applicable legal requirements.
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Cookies and similar technologies</h3>
      <p className="text-base text-gray-700 mb-2">
        Most web browsers are set to accept cookies by default. If you prefer, you can usually
        choose to set your browser to remove cookies and to reject cookies. If you choose to remove
        cookies or reject cookies, this could affect certain features or services of our Services.
        For further information, please see our Cookie Notice:{' '}
        <a
          href="https://www.3dthium.co.uk/cookies"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.3dthium.co.uk/cookies
        </a>
        .
      </p>
    </section>

    {/* --- Section 11 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="DNT">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        11. Controls for do-not-track features
      </h2>
      <p className="text-base text-gray-700 mb-2">
        Most web browsers and some mobile operating systems and mobile applications include a
        Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy
        preference not to have data about your online browsing activities monitored and collected.
        At this stage, no uniform technology standard for recognising and implementing DNT signals
        has been finalised. As such, we do not currently respond to DNT browser signals or any other
        mechanism that automatically communicates your choice not to be tracked online. If a
        standard for online tracking is adopted that we must follow in the future, we will inform
        you about that practice in a revised version of this Privacy Notice.
      </p>
    </section>

    {/* --- Section 12 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="policyupdates">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        12. Do we make updates to this notice?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        <span className="font-semibold">In Short:</span> Yes, we will update this notice as
        necessary to stay compliant with relevant laws.
      </p>
      <p className="text-base text-gray-700 mb-2">
        We may update this Privacy Notice from time to time. The updated version will be indicated
        by an updated &quot;Revised&quot; date at the top of this Privacy Notice. If we make
        material changes to this Privacy Notice, we may notify you either by prominently posting a
        notice of such changes or by directly sending you a notification. We encourage you to review
        this Privacy Notice frequently to be informed of how we are protecting your information.
      </p>
    </section>

    {/* --- Section 13 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="contact">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        13. How can you contact us about this notice?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        If you have questions or comments about this notice, you may email us at{' '}
        <a href="mailto:info@3dthium.co.uk" className="text-blue-600 underline hover:text-blue-800">
          info@3dthium.co.uk
        </a>{' '}
        or contact us by post at:
      </p>
      <address className="not-italic text-base text-gray-700">
        3Dthium
        <br />
        [Your Address Here]
        <br />
        United Kingdom
      </address>
    </section>

    {/* --- Section 14 --- */}
    {/* biome-ignore lint/correctness/useUniqueElementIds: Static page anchor */}
    <section className="mb-8" id="request">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        14. How can you review, update, or delete the data we collect from you?
      </h2>
      <p className="text-base text-gray-700 mb-2">
        You have the right to request access to the personal information we collect from you,
        details about how we have processed it, correct inaccuracies, or delete your personal
        information. You may also have the right to withdraw your consent to our processing of your
        personal information. These rights may be limited in some circumstances by applicable law.
        To request to review, update, or delete your personal information, please{' '}
        <a
          href="https://app.termly.io/notify/dbe89344-a7b0-499f-bc97-2d188aeb4667"
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          fill out and submit a data subject access request
        </a>
        .
      </p>
    </section>
  </div>
)

export default PrivacyPage
