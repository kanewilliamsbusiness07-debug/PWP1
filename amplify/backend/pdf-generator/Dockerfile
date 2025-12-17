FROM public.ecr.aws/lambda/nodejs:18

# Install Chromium dependencies
RUN yum -y install nss libXScrnSaver alsa-lib libX11 libXcomposite libXcursor libXdamage libXrandr libXext libXfixes libXrender libXss libXtst

# Create app dir
WORKDIR /var/task

# Copy handler
COPY handler.ts ./
COPY package.json ./

# Install dependencies (include puppeteer-core)
RUN npm ci --production

# Note: For real PDF rendering, include a Chromium binary compatible with Lambda or use chromium AWS layer.
CMD ["handler.handler"]
